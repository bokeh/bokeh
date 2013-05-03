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
        if withvalues:
            return dict((k,getattr(self,k)) for k in self.__properties__)
        else:
            return self.__properties__[:]
    
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
                self.__view_model__, self._id)


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


class DataSpec(HasProps):
    """ Mirrors the BokehJS data spec. References a DataSource and uses a
    field on it, with potential defaults.

    This is not a PlotObject because it does not get serialized directly,
    nor does it get a ref/id from the session.  Its information gets 
    incorporated into the serialization of Glyphs and renderers.
    """
    # TODO: It would be nice to reconcile this with ColumnsRef; it's
    # weird that DataRanges use ColumnsRef instead of DataSpecs

    # The BokehJS data spec does not necessarily 
    datasource = Instance(DataSource)

    # The default value for this numerical field
    default = Any()
    
    # The column name in the datasource
    field = String()

    # This was originally in the dataspec, but seems to be on glyphspec now
    #units = Enum("data", "screen")

    def to_dataspec(self):
        # We don't automatically set variables in the dict unless they have
        # real values, because in some cases the mere presence of the field
        # may flag or be interpreted as an override.
        d = {}
        if self.default is not None:
            d["default"] = self.default
        if self.field is not None:
            d["field"] = self.field
        return d

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

# We shouldn't need to create mappers manually on the Python side.
# 
#class LinearMapper(PlotObject):
#    pass

#class GridMapper(PlotObject):
#    domain_mapper = Instance(LinearMapper)
#    codomain_mapper = Instance(LinearMapper)


class Glyph(PlotObject):
    """ Base class for glyphs.  Used by GlyphRenderer. """
    # TODO: Should this actually be a metaclass, so that glyph
    # attributes get stored correctly as glyphspecs?

    glyphtype = String

    def to_glyphspec(self):
        """ Returns a glyphspec-style nested dictionary representation
        of this Glyph.
        """
        raise NotImplementedError

class GlyphRenderer(PlotObject):
    
    data_source = Instance(DataSource)
    xdata_range = Instance(DataRange1d)
    ydata_range = Instance(DataRange1d)

    # How to intepret the values in the data_source
    units = Enum("screen", "data")

    # The glyphs
    glyph = Instance(Glyph)

    def vm_serialize(self):
        # GlyphRenderers need to serialize their state a little differently,
        # because the internal glyph instance is turned into a glyphspec
        return { "data_source": self.data_source,
                 "xdata_range": self.xdata_range,
                 "ydata_range": self.ydata_range,
                 "glyphspec": self.glyph.to_glyphspec() }


class Circle(Glyph):
    
    # This is a class attribute that corresponds to the mapping defined in
    # BokehJS glyphs.coffee.
    glyphtype = String("circle")

    x = Instance(DataSpec)
    y = Instance(DataSpec)
    radius = Instance(DataSpec)

    fill = Color("gray")
    fill_alpha = Percent(1.0)
    line_color = Color("red")
    line_width = Size(1)
    line_alpha = Percent(1.0)
    line_join = String("miter")
    line_cap = String("butt")
    line_dash = Pattern
    line_dash_offset = Int(0)

    def to_glyphspec(self):
        props = self.vm_props(withvalues=True)
        props["type"] = props.pop("glyphtype")
        for dataprop in ("radius", "x", "y"):
            if props.get(dataprop, None):
                dataspec = props[dataprop]
                if isinstance(dataspec, basestring):
                    props[dataprop] = dict(field=dataspec)
                elif isinstance(dataspec, DataSpec):
                    props[dataprop] = props[dataprop].to_dataspec()
                else:
                    props[dataprop] = dict(default=dataspec)
        return props

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

    background_fill = Color
    border_fill = Color
    canvas_width = Int
    canvas_height = Int
    outer_width = Int
    outer_height = Int
    border = Int
    border_top = Int
    border_bottom = Int
    border_left = Int
    border_right = Int
    

#class Plot2d(PlotArea):
#    """ A simple PlotArea which contains a single 2D mapper, and any number
#    of glyphs to render.  Supports at most one axis on each side.

#    TODO: This should actually reflect some sort of plot convenience
#    object on the JS side.
#    """

#    x_range = Instance
#    y_range = Instance

#    # There isn't a Plot2d class in BokehJS, but we might as well
#    # explicitly declare this for now.
#    __view_model__ = "Plot2d"

#    def __init__(self, *args, **kw):
#        super(Plot2d, self).__init__(*args, **kw)
#        # Create a default mapper if we don't already have one
#        if self.x_range is None:
#            self.x_range = DataRange1d()
#        if self.y_range is None:
#            self.y_range = DataRange1d()
#        self.mapper = Mapper2d(x_range=self.x_range,
#                        y_range=self.y_range)
#    
#    def __add__(self, rval):
#        if isinstance(rval, GlyphRenderer):
#            self.renderers.append(rval)
#            return self
#        elif isinstance(rval, LinearAxis):
#            self.axes.append(rval)
#            return self
#        elif isinstance(rval, Grid):
#            self.grids.append(rval)
#            return self

#class PolarPlot(PlotArea):

#    radial_range = Instance(DataRange1d)
#    angular_range = Instance(DataRange1d)

class GridPlot(PlotObject):
    """ A 2D grid of plots """
    
    children = List(List)
    border_space = Int(0)


class LinearAxis(PlotObject):

    orientation = Enum("bottom", "left", "right", "top")
    data_range = Instance(DataRange1d)
    ticks = Int(3)

class PanTool(PlotObject):
    plot = Instance(Plot)
    dimensions = List   # valid values: "x", "y"
    dataranges = List

class ZoomTool(PlotObject):
    plot = Instance(Plot)
    dimensions = List   # valid values: "x", "y"
    dataranges = List



