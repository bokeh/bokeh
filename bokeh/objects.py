""" Collection of core plotting objects, which can be represented in the
Javascript layer.  The object graph formed by composing the objects in
this module can be stored as a backbone.js model graph, and stored in a
plot server or serialized into JS for embedding in HTML or an IPython
notebook.
"""
from __future__ import absolute_import

import warnings
import logging
logger = logging.getLogger(__file__)

from . import _glyph_functions
from .properties import (HasProps, Dict, Enum, Either, Float, Instance, Int,
    Datetime,
    List, String, Color, Date, Include, Bool, Tuple, Any)
from .mixins import LineProps, TextProps
from .enums import DatetimeUnits, Dimension, Location, Orientation, Units
from .plot_object import PlotObject
from .glyphs import BaseGlyph

class DataSource(PlotObject):
    """ Base class for data sources """
    # List of names of the fields of each tuple in self.data
    # ordering is incoporated here
    column_names = List(String)
    selected = List(Int) # index of selected points

    def columns(self, *columns):
        """ Returns a ColumnsRef object that points to a column or set of
        columns on this data source
        """
        return ColumnsRef(source=self, columns=list(columns))

class ColumnsRef(HasProps):
    source = Instance(DataSource)
    columns = List(String)

class ColumnDataSource(DataSource):
    # Maps names of columns to sequences or arrays
    data = Dict(String, Any)

    # Maps field/column name to a DataRange or FactorRange object. If the
    # field is not in the dict, then a range is created automatically.
    cont_ranges = Dict(String, Instance(".objects.Range"))
    discrete_ranges = Dict(String, Instance(".objects.Range"))

    def __init__(self, *args, **kw):
        """ Modify the basic DataSource/PlotObj constructor so that if we
        are called with a single argument that is a dict, then we treat
        that implicitly as our "data" attribute.
        """
        if len(args) == 1 and "data" not in kw:
            kw["data"] = args[0]
        raw_data = kw.pop("data", {})
        if not isinstance(raw_data, dict):
            import pandas as pd
            if isinstance(raw_data, pd.DataFrame):
                dfindex = raw_data.index
                new_data = {}
                for colname in raw_data:
                    new_data[colname] = raw_data[colname].tolist()
                if dfindex.name:
                    new_data[dfindex.name] = dfindex.tolist()
                elif dfindex.names and not all([x is None for x in dfindex.names]):
                    new_data["_".join(dfindex.names)] = dfindex.tolist()
                else:
                    new_data["index"] = dfindex.tolist()
                raw_data = new_data
        for name, data in raw_data.items():
            self.add(data, name)
        super(ColumnDataSource, self).__init__(**kw)

    def to_df(self):
        """convert data source to pandas dataframe
        local import of pandas because of possible compatability issues (pypy?)
        if we have column_names set, we use those, otherwise we let
        pandas infer the column names.  column_names can be used to
        either order or filter the columns here.
        """
        import pandas as pd
        if self.column_names:
            return pd.DataFrame(self.data, columns=self.column_names)
        else:
            return pd.DataFrame(self.data)

    def add(self, data, name=None):
        """ Appends the data to the list of columns.  Returns the name
        that was inserted.
        """
        if name is None:
            n = len(self.data)
            while "Series %d"%n in self.data:
                n += 1
            name = "Series %d"%n
        self.column_names.append(name)
        self.data[name] = data
        return name

    def remove(self, name):
        try:
            self.column_names.remove(name)
            del self.data[name]
        except (ValueError, KeyError):
            warnings.warn("Unable to find column '%s' in datasource" % name)

class ServerDataSource(DataSource):
    data_url = String()
    owner_username = String()

    # allow us to add some data that isn't on the remote source
    # and join it to the remote data
    data = Dict(String, Any)

    # Paramters of data transformation operations
    # The 'Any' is used to pass primtives around.  Minimally, a tag to say which downsample routine to use.  In some downsamplers, parameters are passed this way too.
    # TODO: Find/create a property type for 'any primitive/atomic value'
    transform = Dict(String,Either(Instance(PlotObject), Any))


class PandasDataSource(DataSource):
    """ Represents serverside data.  This gets stored into the plot server's
    database, but it does not have any client side representation.  Instead,
    a PandasPlotSource needs to be created and pointed at it.
    """

    data = Dict(String, Any)

class Range(PlotObject):
    pass

class Range1d(Range):
    """ Represents a fixed range [start, end] in a scalar dimension. """
    start = Either(Float, Datetime)
    end = Either(Float, Datetime)

class DataRange(Range):
    sources = List(Instance(ColumnsRef))

    def finalize(self, models):
        props = super(DataRange, self).finalize(models)
        props['sources'] = [ ColumnsRef(**source) for source in props['sources'] ]
        return props

class DataRange1d(DataRange):
    """ Represents an auto-fitting range in a scalar dimension. """
    rangepadding = Float(0.1)
    start = Float
    end = Float

class FactorRange(Range):
    """ Represents a range in a categorical dimension """
    factors = List(Any)

class Renderer(PlotObject):
    pass

class Ticker(PlotObject):
    """ Base class for all ticker types. """
    num_minor_ticks = Int(5)

class AdaptiveTicker(Ticker):
    """ Generate nice round ticks at any magnitude.

    Creates ticks that are `base` multiples of a set of given
    mantissas. For example, with base=10 and mantissas=[1, 2, 5] this
    ticker will generate the sequence:

            ..., 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, ...

    Attributes:
        base (float) : multiplier for scaling mantissas
        mantissas list(float) : numbers to generate multiples of
        min_interval (float) : smallest interval between two ticks
        max_interval (float) : largest interval between two ticks

    """
    base = Float(10.0)
    mantissas = List(Float, [2, 5, 10])
    min_interval = Float(0.0)
    max_interval = Float(100.0)

class CompositeTicker(Ticker):
    """ Combine different tickers at different scales.

    Uses the `min_interval` and `max_interval` interval attributes of the
    tickers to order the tickers. The supplied tickers should be in order.
    Specifically, if S comes before T, then it should be the case that:

        S.get_max_interval() < T.get_min_interval()

    Attributes:
        tickers (Ticker) : a list of tickers in increasing interval size

    """
    tickers = List(Instance(Ticker))

class SingleIntervalTicker(Ticker):
    """ Generate evenly spaced ticks at a fixed interval regardless of scale.

    Attributes:
        interval (float) : interval between two ticks
    """
    interval = Float

class DaysTicker(Ticker):
    """ Generate ticks spaced apart by specific, even multiples of days.

    Attributes:
        days (int) : intervals of days to use

    """
    days = List(Int)

class MonthsTicker(Ticker):
    """ Generate ticks spaced apart by specific, even multiples of months.

    Attributes:
        months (int) : intervals of months to use

    """
    months = List(Int)

class YearsTicker(Ticker):
    """ Generate ticks spaced even numbers of years apart. """
    pass

class BasicTicker(Ticker):
    """ Generate ticks on a linear scale. """
    pass

class LogTicker(Ticker):
    """ Generate ticks on a log scale. """
    pass

class CategoricalTicker(Ticker):
    """ Generate ticks for categorical ranges. """
    pass

class DatetimeTicker(Ticker):
    """ Generate nice ticks across different date and time scales. """
    pass

class TickFormatter(PlotObject):
    """ Base class for all tick formatter types. """
    pass

class BasicTickFormatter(TickFormatter):
    """ Format ticks as generic numbers from a continuous numeric range

    Attributes:
        precision ('auto' or int) : how many digits of precision to display
        use_scientific (bool) : whether to switch to scientific notation
            when to switch controlled by `power_limit_low` and `power_limit_high`
        power_limit_high (int) : use scientific notation on numbers this large
        power_limit_low (int) : use scientific notation on numbers this small

    """
    precision = Either(Enum('auto'), Int)
    use_scientific = Bool(True)
    power_limit_high = Int(5)
    power_limit_low = Int(-3)

class LogTickFormatter(TickFormatter):
    """ Format ticks as powers of 10.

    Often useful in conjuction with a `LogTicker`

    """
    pass

class CategoricalTickFormatter(TickFormatter):
    """ Format ticks as categories from categorical ranges"""
    pass

class DatetimeTickFormatter(TickFormatter):
    """ Represents a categorical tick formatter for an axis object """
    formats = Dict(Enum(DatetimeUnits), List(String))

class Glyph(Renderer):
    server_data_source = Instance(ServerDataSource)
    data_source = Instance(DataSource)
    xdata_range = Instance(Range)
    ydata_range = Instance(Range)

    # How to intepret the values in the data_source
    units = Enum(Units)

    glyph = Instance(BaseGlyph)

    # Optional glyph used when data is selected.
    selection_glyph = Instance(BaseGlyph)
    # Optional glyph used when data is unselected.
    nonselection_glyph = Instance(BaseGlyph)

    def vm_serialize(self):
        # Glyphs need to serialize their state a little differently,
        # because the internal glyph instance is turned into a glyphspec
        data =  {"id" : self._id,
                 "data_source": self.data_source,
                 "server_data_source" : self.server_data_source,
                 "xdata_range": self.xdata_range,
                 "ydata_range": self.ydata_range,
                 "glyphspec": self.glyph.to_glyphspec(),
                 "name": self.name,
                 }
        if self.selection_glyph:
            data['selection_glyphspec'] = self.selection_glyph.to_glyphspec()
        if self.nonselection_glyph:
            data['nonselection_glyphspec'] = self.nonselection_glyph.to_glyphspec()
        return data

    def finalize(self, models):
        props = super(Glyph, self).finalize(models)

        if hasattr(self, "_special_props"):
            glyphspec = self._special_props.pop('glyphspec', None)
            if glyphspec is not None:
                cls = PlotObject.get_class(glyphspec.pop('type'))
                props['glyph'] = cls(**glyphspec)

            selection_glyphspec = self._special_props.pop('selection_glyphspec', None)
            if selection_glyphspec is not None:
                cls = PlotObject.get_class(selection_glyphspec.pop('type'))
                props['selection_glyph'] = cls(**selection_glyphspec)

            nonselection_glyphspec = self._special_props.pop('nonselection_glyphspec', None)
            if nonselection_glyphspec is not None:
                cls = PlotObject.get_class(nonselection_glyphspec.pop('type'))
                props['nonselection_glyph'] = cls(**nonselection_glyphspec)

        return props

class Widget(PlotObject):
    pass

class Canvas(PlotObject):
    # TODO (bev) remove default dims here, see #561
    def __init__(self, canvas_height=600, canvas_width=600, **kwargs):
        kwargs['canvas_width'] = canvas_width
        kwargs['canvas_height'] = canvas_height
        super(Canvas, self).__init__(**kwargs)
    botton_bar = Bool(True)
    canvas_height = Int(600)
    canvas_width = Int(600)
    map = Bool(False)
    use_hdpi = Bool(True)

class Plot(Widget):
    """ Object representing a plot, containing glyphs, guides, annotations.
    """

    def __init__(self, **kwargs):
        if 'border_symmetry' in kwargs:
            border_symmetry = kwargs.pop('border_symmetry')
            if border_symmetry is None: border_symmetry = ""
            kwargs.setdefault('h_symmetry', 'h' in border_symmetry or 'H' in border_symmetry)
            kwargs.setdefault('v_symmetry', 'v' in border_symmetry or 'V' in border_symmetry)
        super(Plot, self).__init__(**kwargs)

    data_sources = List(Instance(DataSource))

    x_range = Instance(Range)
    y_range = Instance(Range)
    x_mapper_type = String('auto')
    y_mapper_type = String('auto')

    title = String('')
    title_props = Include(TextProps, prefix="title")
    outline_props = Include(LineProps, prefix="outline")

    # A list of all renderers on this plot; this includes guides as well
    # as glyph renderers
    renderers = List(Instance(Renderer))
    tools = List(Instance(".objects.Tool"))

    left = List(Instance(PlotObject))
    right = List(Instance(PlotObject))
    above = List(Instance(PlotObject))
    below = List(Instance(PlotObject))

    plot_height = Int(600)
    plot_width = Int(600)

    background_fill = Color("white")
    border_fill = Color("white")

    min_border_top = Int(50)
    min_border_bottom = Int(50)
    min_border_left = Int(50)
    min_border_right = Int(50)
    min_border = Int(50)

    h_symmetry = Bool(True)
    v_symmetry = Bool(False)

    annular_wedge     = _glyph_functions.annular_wedge
    annulus           = _glyph_functions.annulus
    arc               = _glyph_functions.arc
    asterisk          = _glyph_functions.asterisk
    bezier            = _glyph_functions.bezier
    circle            = _glyph_functions.circle
    circle_cross      = _glyph_functions.circle_cross
    circle_x          = _glyph_functions.circle_x
    cross             = _glyph_functions.cross
    diamond           = _glyph_functions.diamond
    diamond_cross     = _glyph_functions.diamond_cross
    image             = _glyph_functions.image
    image_rgba        = _glyph_functions.image_rgba
    image_url         = _glyph_functions.image_url
    inverted_triangle = _glyph_functions.inverted_triangle
    line              = _glyph_functions.line
    multi_line        = _glyph_functions.multi_line
    oval              = _glyph_functions.oval
    patch             = _glyph_functions.patch
    patches           = _glyph_functions.patches
    quad              = _glyph_functions.quad
    quadratic         = _glyph_functions.quadratic
    ray               = _glyph_functions.ray
    rect              = _glyph_functions.rect
    segment           = _glyph_functions.segment
    square            = _glyph_functions.square
    square_cross      = _glyph_functions.square_cross
    square_x          = _glyph_functions.square_x
    text              = _glyph_functions.text
    triangle          = _glyph_functions.triangle
    wedge             = _glyph_functions.wedge
    x                 = _glyph_functions.x

class MapOptions(HasProps):
    lat = Float
    lng = Float
    zoom = Int(12)

class GMapPlot(Plot):
    map_options = Instance(MapOptions)

class GridPlot(Plot):
    """ A 2D grid of plots """

    children = List(List(Instance(Plot)))
    border_space = Int(0)

class GuideRenderer(Renderer):
    plot = Instance(Plot)

    def __init__(self, **kwargs):
        super(GuideRenderer, self).__init__(**kwargs)

        if self.plot is not None:
            if self not in self.plot.renderers:
                self.plot.renderers.append(self)

class Axis(GuideRenderer):
    type = String("axis")

    location = Either(Enum('auto'), Enum(Location))
    bounds = Either(Enum('auto'), Tuple(Float, Float))

    ticker = Instance(Ticker)
    formatter = Instance(TickFormatter)

    axis_label = String
    axis_label_standoff = Int
    axis_label_props = Include(TextProps, prefix="axis_label")

    major_label_standoff = Int
    major_label_orientation = Either(Enum("horizontal", "vertical"), Float)
    major_label_props = Include(TextProps, prefix="major_label")

    axis_props = Include(LineProps, prefix="axis")
    tick_props = Include(LineProps, prefix="major_tick")

    major_tick_in = Int
    major_tick_out = Int

class ContinuousAxis(Axis):
    pass

class LinearAxis(ContinuousAxis):
    def __init__(self, ticker=BasicTicker(), formatter=BasicTickFormatter(), **kwargs):
        super(LinearAxis, self).__init__(ticker=ticker, formatter=formatter, **kwargs)

class LogAxis(ContinuousAxis):
    def __init__(self, ticker=LogTicker(num_minor_ticks=10), formatter=LogTickFormatter(), **kwargs):
        super(LogAxis, self).__init__(ticker=ticker, formatter=formatter, **kwargs)

class CategoricalAxis(Axis):
    def __init__(self, ticker=CategoricalTicker(), formatter=CategoricalTickFormatter(), **kwargs):
        super(CategoricalAxis, self).__init__(ticker=ticker, formatter=formatter, **kwargs)

class DatetimeAxis(LinearAxis):
    axis_label = String("date")
    scale = String("time")
    num_labels = Int(8)
    char_width = Int(10)
    fill_ratio = Float(0.3)

    def __init__(self, ticker=DatetimeTicker(), formatter=DatetimeTickFormatter(), **kwargs):
        super(DatetimeAxis, self).__init__(ticker=ticker, formatter=formatter, **kwargs)

class Grid(GuideRenderer):
    """ 1D Grid component """
    type = String("grid")

    dimension = Int(0)
    bounds = String('auto')

    ticker = Instance(Ticker)

    grid_props = Include(LineProps, prefix="grid")

class Tool(PlotObject):
    plot = Instance(Plot)

class PanTool(Tool):
    dimensions = List(Enum(Dimension), default=["width", "height"])

class WheelZoomTool(Tool):
    dimensions = List(Enum(Dimension), default=["width", "height"])

class PreviewSaveTool(Tool):
    pass

class EmbedTool(Tool):
    pass

class ResetTool(Tool):
    pass

class ResizeTool(Tool):
    pass

class ClickTool(Tool):
    names = List(String)
    always_active = Bool(True)

class CrosshairTool(Tool):
    pass

class BoxZoomTool(Tool):
    pass

class BoxSelectTool(Tool):
    renderers = List(Instance(Renderer))
    select_every_mousemove = Bool(True)
    select_x = Bool(True)
    select_y = Bool(True)

class BoxSelectionOverlay(Renderer):
    __view_model__ = 'BoxSelection'
    tool = Instance(Tool)

class HoverTool(Tool):
    renderers = List(Instance(Renderer))
    tooltips = Dict(String, String)
    always_active = Bool(True)

class ObjectExplorerTool(Tool):
    pass

class DataRangeBoxSelectTool(Tool):
    xselect = List(Instance(Range))
    yselect = List(Instance(Range))

class Legend(Renderer):
    plot = Instance(Plot)
    orientation = Enum(Orientation)
    border = Include(LineProps, prefix="border")

    label_props = Include(TextProps, prefix="label")
    label_standoff = Int(15)
    label_height = Int(20)
    label_width = Int(50)

    glyph_height = Int(20)
    glyph_width = Int(20)

    legend_padding = Int(10)
    legend_spacing = Int(3)
    legends = Dict(String, List(Instance(Glyph)))

class DataSlider(Renderer):
    plot = Instance(Plot)
    data_source = Instance(DataSource)
    field = String()

class PlotContext(PlotObject):
    """ A container for multiple plot objects. """
    children = List(Instance(PlotObject))

class PlotList(PlotContext):
    # just like plot context, except plot context has special meaning
    # everywhere, so plotlist is the generic one
    pass
