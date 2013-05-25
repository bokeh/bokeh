""" Collection of core plotting objects, which can be represented in the 
Javascript layer.  The object graph formed by composing the objects in
this module can be stored as a backbone.js model graph, and stored in a
plot server or serialized into JS for embedding in HTML or an IPython
notebook.
"""

from functools import wraps

from bokeh.properties import (HasProps, MetaHasProps, 
        Any, Dict, Enum, Float, Instance, Int, List, String,
        Color, Pattern, Percent, Size)

class Viewable(MetaHasProps):
    """ Any plot object (Data Model) which has its own View Model in the
    persistence layer.

    Adds handling of a __view_model__ attribute to the class (which is
    provided by default) which tells the View layer what View class to 
    create.

    One thing to keep in mind is that a Viewable should have a single
    unique representation in the persistence layer, but it might have
    multiple concurrent client-side Views looking at it.  Those may
    be from different machines altogether.
    """

    # Stores a mapping from subclass __view_model__ names to classes
    model_class_reverse_map = {}

    # Mmmm.. metaclass inheritance.  On the one hand, it seems a little
    # overkill. On the other hand, this is exactly the sort of thing
    # it's meant for.
    def __new__(cls, class_name, bases, class_dict):
        if "__view_model__" not in class_dict:
            class_dict["__view_model__"] = class_name
        class_dict["get_class"] = Viewable.get_class

        # Create the new class
        newcls = super(Viewable,cls).__new__(cls, class_name, bases, class_dict)
        
        # Add it to the reverse map, but check for duplicates first
        if class_dict["__view_model__"] in Viewable.model_class_reverse_map:
            raise Warning("Duplicate __view_model__ declaration of '%s' for " \
                          "class %s.  Previous definition: %s" % \
                          (class_dict['__view_model__'], class_name,
                            Viewable.model_class_reverse_map[class_name]))
        Viewable.model_class_reverse_map[class_name] = newcls
        return newcls

    @staticmethod
    def get_class(view_model_name):
        """ Given a __view_model__ name, returns the corresponding class
        object
        """
        d = Viewable.model_class_reverse_map
        if view_model_name in d:
            return d[view_model_name]
        else:
            raise KeyError("View model name '%s' not found" % view_model_name)


def usesession(meth):
    """ Checks for 'session' in kwargs and in **self**, and guarantees
    that **kw always has a valid 'session' parameter.  Wrapped methods
    should define 'session' as an optional argument, and in the body of
    the method, should expect an 
    """
    @wraps(meth)
    def wrapper(self, *args, **kw):
        session = kw.get("session", None)
        if session is None:
            session = getattr(self, "session")
        if session is None:
            raise RuntimeError("Call to %s needs a session" % meth.__name__)
        kw["session"] = session
        return meth(self, *args, **kw)
    return wrapper

class PlotObject(HasProps):
    """ Base class for all plot-related objects """

    __metaclass__ = Viewable

    session = Instance   # bokeh.session.Session

    def __init__(self, *args, **kwargs):
        if "id" in kwargs:
            self._id = kwargs.pop("id")
        super(PlotObject, self).__init__(*args, **kwargs)

    #---------------------------------------------------------------------
    # View Model connection methods
    #
    # Whereas a rich client rendering framework can maintain view state
    # alongside model state, we need an explicit send/receive protocol for
    # communicating with a set of view models that reside on the front end.
    # Many of the calls one would expect in a rich client map instead to
    # batched updates on the M-VM-V approach.
    #---------------------------------------------------------------------

    def vm_props(self, withvalues=False):
        """ Returns the ViewModel-related properties of this object.  If
        **withvalues** is True, then returns attributes with values as a 
        dict.  Otherwise, returns a list of attribute names.
        """
        props = self.properties()
        props.remove("session")
        if withvalues:
            return dict((k,getattr(self,k)) for k in props)
        else:
            return props
    
    def vm_serialize(self):
        """ Returns a dictionary of the attributes of this object, in 
        a layout corresponding to what BokehJS expects at unmarshalling time.
        """
        return self.vm_props(withvalues=True)

    @usesession
    def pull(self, session=None, ref=None):
        """ Pulls information from the given session and ref id into this
        object.  If no session is provided, then uses self.session.
        If no ref is given, uses self._id.
        """
        # Read session values into a new dict, and fill those into self
        newattrs = session.load(ref, asdict=True)
        # Loop over attributes and call setattr() instead of doing a bulk
        # self.__dict__.update because some attributes may be properties.
        for k,v in newattrs["attributes"].iteritems():
            setattr(self, k, v)

    @usesession
    def push(self, session=None):
        """ Pushes the update values from this object into the given
        session (or self.session, if none is provided).
        """
        session.store(self)

    def __str__(self):
        return "%s, ViewModel:%s, ref _id: %s" % (self.__class__.__name__,
                self.__view_model__, getattr(self, "_id", None))


class DataSource(PlotObject):
    """ Base class for data sources """

    def columns(self, *columns):
        """ Returns a ColumnsRef object that points to a column or set of
        columns on this data source
        """
        return ColumnsRef(source=self, columns=columns)

class ColumnsRef(HasProps):
    source = Instance(DataSource)
    columns = List(String)

class ColumnDataSource(DataSource):
    # Maps names of columns to sequences or arrays
    data = Dict()

    # Maps field/column name to a DataRange or FactorRange object. If the
    # field is not in the dict, then a range is created automatically.
    cont_ranges = Dict()
    discrete_ranges = Dict()

class ObjectArrayDataSource(DataSource):
    # List of tuples of values 
    data = List()

    # List of names of the fields of each tuple in self.data
    column_names = List()

    # Maps field/column name to a DataRange or FactorRange object. If the
    # field is not in the dict, then a range is created automatically.
    cont_ranges = Dict()
    discrete_ranges = Dict()

class PandasDataSource(DataSource):
    """ Represents serverside data.  This gets stored into the plot server's
    database, but it does not have any client side representation.  Instead,
    a PandasPlotSource needs to be created and pointed at it.
    """

    data = Dict()


class DataRange1d(PlotObject):    
    """ Represents a range in a scalar dimension """
    sources = List(ColumnsRef)
    start = Float()
    end = Float()
    rangepadding = Float(0.1)

    def vm_serialize(self):
        props = self.vm_props(withvalues=True)
        sources = props.pop("sources")
        props["sources"] = [{"ref":cr.source, "columns":cr.columns} for cr in sources]
        return props

class FactorRange(PlotObject):
    """ Represents a range in a categorical dimension """
    sources = List(ColumnsRef)
    values = List()
    columns = List()

class GlyphRenderer(PlotObject):
    
    data_source = Instance(DataSource)
    xdata_range = Instance(DataRange1d)
    ydata_range = Instance(DataRange1d)

    # How to intepret the values in the data_source
    units = Enum("screen", "data")

    # Instance of bokeh.glyphs.Glyph; not declaring it explicitly below
    # because of circular imports. The renderers should get moved out
    # into another module...
    glyph = Instance

    def vm_serialize(self):
        # GlyphRenderers need to serialize their state a little differently,
        # because the internal glyph instance is turned into a glyphspec
        return { "data_source": self.data_source,
                 "xdata_range": self.xdata_range,
                 "ydata_range": self.ydata_range,
                 "glyphspec": self.glyph.to_glyphspec() }

class Plot(PlotObject):

    data_sources = List
    title = String("Bokeh Plot")

    x_range = Instance(DataRange1d)
    y_range = Instance(DataRange1d)

    # We shouldn't need to create mappers manually on the Python side
    #xmapper = Instance(LinearMapper)
    #ymapper = Instance(LinearMapper)
    #mapper = Instance(GridMapper)

    # A list of all renderers on this plot; this includes guides as well
    # as glyph renderers
    renderers = List
    tools = List

    # TODO: These don't appear in the CS source, but are created by mpl.py, so
    # I'm leaving them here for initial compatibility testing.
    axes = List

    # TODO: How do we want to handle syncing of the different layers?
    # image = List
    # underlay = List
    # glyph = List
    # overlay = List
    # annotation = List

    height = Int(400)
    width = Int(400)

    background_fill = Color("white")
    border_fill = Color("white")
    canvas_width = Int(400)
    canvas_height = Int(400)
    outer_width = Int(400)
    outer_height = Int(400)
    border_top = Int(50)
    border_bottom = Int(50)
    border_left = Int(50)
    border_right = Int(50)
    

#class PolarPlot(PlotArea):

#    radial_range = Instance(DataRange1d)
#    angular_range = Instance(DataRange1d)

class GridPlot(PlotObject):
    """ A 2D grid of plots """
    
    children = List(List)
    border_space = Int(0)

class GuideRenderer(PlotObject):
    plot = Instance
    dimension = Int(0)
    location = String('min')
    bounds = String('auto')

    def __init__(self, **kwargs):
        super(GuideRenderer, self).__init__(**kwargs)
        if self.plot is not None:
            self.plot.renderers.append(self)
    
    def vm_serialize(self):
        props = self.vm_props(withvalues=True)
        del props["plot"]
        return { "plot" : self.plot,
                 "guidespec" : props}

class LinearAxis(GuideRenderer):
    type = String("linear_axis")

class Rule(GuideRenderer):
    """ 1D Grid component """
    type = String("rule")

class PanTool(PlotObject):
    plot = Instance(Plot)
    dimensions = List   # valid values: "x", "y"
    dataranges = List

class ZoomTool(PlotObject):
    plot = Instance(Plot)
    dimensions = List   # valid values: "x", "y"
    dataranges = List



