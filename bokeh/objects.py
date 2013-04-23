""" Collection of core plotting objects, which can be represented in the 
Javascript layer.  The object graph formed by composing the objects in
this module can be stored as a backbone.js model graph, and stored in a
plot server or serialized into JS for embedding in HTML or an IPython
notebook.
"""

from bokeh.bbmodel import ContinuumModel

from properties import MetaHasProps

class MetaPlotObject(MetaHasProps):
    # Mmmm.. metaclass inheritance.  On the one hand, it seems a little
    # overkill. On the other hand, this is exactly the sort of thing
    # it's meant for.
    def __new__(cls, class_name, bases, class_dict):
        class_dict['__backbone_model__'] = class_name
        return MetaHasProps.__new__(cls, class_name, bases, class_dict)

class PlotObject(HasProps):
    """ Base class for all plot-related objects """

    __metaclass__ = MetaPlotObject
    
    # The serialization ID for this object
    _id = None

    def ref(self):
        """ Returns the backbone ref for this object """
        return {
                'type': self.__backbone_model__,
                'id': self._id
                }

    def serialize(self, format=None):
        """
        Get refs for all of our attributes that can reference other
        models.  Use the __properties__ attribute to get this list.

        Valid arguments for **format** are None, "json", "yaml".  If 
        None, then returns a Python dict that has no complex nested
        objects (but potentially does nest dicts, tuples, etc.).
        """
        d = self.ref()
        d.update(dict((k, getattr(self,k)) for k in self.__properties__))
        if format is None:
            return d
        elif format == "json":
            return json.dumps(d)
        return 


class GenericPlotObject(PlotObject):

    def __init__(self):
        self.a = 10
        self.b = 20
        self._initialized = True

    def __setattr__(self, attr, val):
        if self._initialized:
            self._attributes[attr] = val
        else:
            setattr(self, attr, val)

    def ref(self):
        return { 'type': 'whateverIwant',
                'id': 1234}

    def serialize(self):
        d = self.ref()
        d.update(dict(
            a = self.a,
            b = self.b
            ))
        return d

class DataSource(PlotObject):
    """ Base class for data sources """


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
    columns = List()

    # Maps field/column name to a DataRange or FactorRange object. If the
    # field is not in the dict, then a range is created automatically.
    cont_ranges = Dict()
    discrete_ranges = Dict()


class DataRange1d(PlotObject):    
    """ Represents a range in a scalar dimension """
    source = Instance(DataSource)
    start = Float()
    end = Float()
    rangepadding = Float(0.1)

class FactorRange(PlotObject):
    """ Represents a range in a categorical dimension """
    source = Instance(DataSource)
    values = List()
    columns = List()


class PlotArea(PlotObject):
    """ A PlotArea is a rectangular region of the screen into which various
    plot objects are rendered.  Subclasses will offer particular 
    configurations of ranges and mappers and axes.
    """

    # The list of renderers on this plot area
    renderers = List

    # A list of named axes and grids available on this PlotArea.
    axes = List
    grids = List

    # The interactor objects on the plot
    tools = List


class Plot2d(PlotArea):
    """ A simple PlotArea which contains a single 2D mapper, and any number
    of glyphs to render.  Supports at most one axis on each side.

    TODO: THis should actually reflect some sort of plot convenience
    object on the JS side.  Since Bryan is still working on that, we
    are using this Python class and then building up the JS objects on
    our own.
    """

    x_range = Instance
    y_range = Instance

    # There isn't a Plot2d class in BokehJS, but we might as well
    # explicitly declare this for now.
    __backbone_model__ = "Plot2d"

    def __init__(self, *args, **kw):
        super(Plot2d, self).__init__(*args, **kw)
        # Create a default mapper if we don't already have one
        if self.x_range is None:
            self.x_range = DataRange1d()
        if self.y_range is None:
            self.y_range = DataRange1d()
        self.mapper = Mapper2d(x_range=self.x_range,
                        y_range=self.y_range)
    
    def __add__(self, rval):
        if isinstance(rval, GlyphRenderer):
            self.renderers.append(rval)
            return self
        elif isinstance(rval, LinearAxis):
            self.axes.append(rval)
            return self
        elif isinstance(rval, Grid):
            self.grids.append(rval)
            return self

class PolarPlot(PlotArea):

    radial_range = Instance(DataRange1d)
    angular_range = Instance(DataRange1d)

class GridPlotContainer(PlotObject):
    pass

class LinearAxis(PlotObject):

    orientation = Enum("bottom", "left", "right", "top")
    data_range = Instance(DataRange1d)


class PanTool(PlotObject):
    plot = Instance(Plot)
    dimensions = List   # valid values: "x", "y"

class ZoomTool(PlotObject):
    plot = Instance(Plot)
    dimensions = List   # valid values: "x", "y"



