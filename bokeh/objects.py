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

from .properties import (HasProps, Dict, Enum, Either, Float, Instance, Int,
    List, String, Color, Include, Bool, Tuple, Any)
from .mixins import FillProps, LineProps, TextProps
from .enums import Units, Orientation, Dimension, BorderSymmetry
from .plotobject import PlotObject
from .glyphs import BaseGlyph

class DataSource(PlotObject):
    """ Base class for data sources """
    # List of names of the fields of each tuple in self.data
    # ordering is incoporated here
    column_names = List(String)
    selected = List(String) # index of selected points

    def columns(self, *columns):
        """ Returns a ColumnsRef object that points to a column or set of
        columns on this data source
        """
        return ColumnsRef(source=self, columns=list(columns))

class ColumnsRef(HasProps):
    source = Instance(DataSource, has_ref=True)
    columns = List(String)

class ColumnDataSource(DataSource):
    # Maps names of columns to sequences or arrays
    data = Dict()

    # Maps field/column name to a DataRange or FactorRange object. If the
    # field is not in the dict, then a range is created automatically.
    cont_ranges = Dict()
    discrete_ranges = Dict()

    def __init__(self, *args, **kw):
        """ Modify the basic DataSource/PlotObj constructor so that if we
        are called with a single argument that is a dict, then we treat
        that implicitly as our "data" attribute.
        """
        if len(args) == 1 and "data" not in kw:
            kw["data"] = args[0]
        raw_data = kw.get("data", {})
        if not isinstance(raw_data, dict):
            import pandas as pd
            if isinstance(raw_data, pd.DataFrame):
                new_data = {}
                for colname in raw_data:
                    new_data[colname] = raw_data[colname].tolist()
                raw_data = new_data
        for name, data in raw_data.items():
            self.add(data, name)
        super(ColumnDataSource, self).__init__(**kw)

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
    data = Dict() 
    # allow us to specify slicing of data on updates
    index_slice = List()
    data_slice = List()
    # allow us to transpose data on updates (for image data)
    transpose = Bool(False)
    
class PandasDataSource(DataSource):
    """ Represents serverside data.  This gets stored into the plot server's
    database, but it does not have any client side representation.  Instead,
    a PandasPlotSource needs to be created and pointed at it.
    """

    data = Dict()

class Range(PlotObject):
    pass

class Range1d(Range):
    start = Float()
    end = Float()

class DataRange(Range):
    sources = List(Instance(ColumnsRef), has_ref=True)

    def finalize(self, models):
        props = super(DataRange, self).finalize(models)
        props['sources'] = [ ColumnsRef(**source) for source in props['sources'] ]
        return props

class DataRange1d(DataRange):
    """ Represents a range in a scalar dimension """
    rangepadding = Float(0.1)
    start = Float
    end = Float

class FactorRange(Range):
    """ Represents a range in a categorical dimension """
    factors = List(Any)

class Renderer(PlotObject):
    pass

class Ticker(PlotObject):
    pass

class AdaptiveTicker(Ticker):
    base = Float(10.0)
    min_interval = Float(0.0)
    max_interval = Float(100.0)

class CompositeTicker(Ticker):
    tickers = List(Instance(Ticker))

class SingleIntervalTicker(Ticker):
    interval = Float

class DaysTicker(Ticker):
    days = List(Int)

class MonthsTicker(Ticker):
    months = List(Int)

class BasicTicker(Ticker):
    pass

class CategoricalTicker(Ticker):
    pass

class DatetimeTicker(Ticker):
    pass

class TickFormatter(PlotObject):
    pass

class BasicTickFormatter(TickFormatter):
    """ Represents a basic tick formatter for an axis object """
    precision = Any('auto')
    use_scientific = Bool(True)
    power_limit_high = Int(5)
    power_limit_low = Int(-3)

class CategoricalTickFormatter(TickFormatter):
    """ Represents a categorical tick formatter for an axis object """
    pass

class DatetimeTickFormatter(TickFormatter):
    """ Represents a categorical tick formatter for an axis object """
    pass

class Glyph(Renderer):
    ServerDataSource = Instance(DataSource, has_ref=True)
    data_source = Instance(DataSource, has_ref=True)
    xdata_range = Instance(Range, has_ref=True)
    ydata_range = Instance(Range, has_ref=True)

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
                 "remote_data_source" : self.remote_data_source,
                 "xdata_range": self.xdata_range,
                 "ydata_range": self.ydata_range,
                 "glyphspec": self.glyph.to_glyphspec()
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

class Plot(PlotObject):
    """ Object representing a plot, containing glyphs, guides, annotations.
    """

    data_sources = List(Instance(DataSource), has_ref=True)

    x_range = Instance(Range, has_ref=True)
    y_range = Instance(Range, has_ref=True)
    png = String('')
    title = String('')
    outline_props = Include(LineProps, prefix="outline")

    # A list of all renderers on this plot; this includes guides as well
    # as glyph renderers
    renderers = List(Instance(Renderer), has_ref=True)
    tools = List(Instance(".objects.Tool"), has_ref=True)

    # TODO: These don't appear in the CS source, but are created by mpl.py, so
    # I'm leaving them here for initial compatibility testing.
    # axes = List(has_ref=True)

    # TODO: How do we want to handle syncing of the different layers?
    # image = List()
    # underlay = List()
    # glyph = List()
    #
    # annotation = List()

    height = Int(600)
    width = Int(600)

    background_fill = Color("white")
    border_fill = Color("white")
    canvas_width = Int(400)
    canvas_height = Int(400)
    outer_width = Int(400)
    outer_height = Int(400)
    min_border_top = Int(50)
    min_border_bottom = Int(50)
    min_border_left = Int(50)
    min_border_right = Int(50)
    min_border = Int(50)
    border_symmetry = Enum(BorderSymmetry)
    script_inject_snippet = String("")

    def vm_props(self):
        # FIXME: We need to duplicate the height and width into canvas and
        # outer height/width.  This is a quick fix for the gorpiness, but this
        # needs to be fixed more structurally on the JS side, and then this
        # should be revisited on the Python side.
        if hasattr(self.session, "root_url"):
            self.script_inject_snippet = self.create_html_snippet(server=True)
        if "canvas_width" not in self._changed_vars:
            self.canvas_width = self.width
        if "outer_width" not in self._changed_vars:
            self.outer_width = self.width
        if "canvas_height" not in self._changed_vars:
            self.canvas_height = self.height
        if "outer_height" not in self._changed_vars:
            self.outer_height = self.height
        return super(Plot, self).vm_props()

class MapOptions(HasProps):
    lat = Float
    lng = Float
    zoom = Int(12)

class GMapPlot(Plot):
    map_options = Instance(MapOptions)

    def vm_serialize(self):
        data = super(GMapPlot, self).vm_serialize()
        self._session.raw_js_snippets(self)
        return data

    def get_raw_js(self):
        return '<script src="https://maps.googleapis.com/maps/api/js?sensor=false"></script>'

class GridPlot(Plot):
    """ A 2D grid of plots """

    children = List(List(Instance(Plot), has_ref=True), has_ref=True)
    border_space = Int(0)

class GuideRenderer(Renderer):
    plot = Instance(Plot, has_ref=True)

    def __init__(self, **kwargs):
        super(GuideRenderer, self).__init__(**kwargs)

        if self.plot is not None:
            if self not in self.plot.renderers:
                self.plot.renderers.append(self)

class Axis(GuideRenderer):
    type = String("axis")

    dimension = Int(0)
    location = Either(String('min'), Float)
    bounds = Either(Enum('auto'), Tuple) # XXX: Tuple(Float, Float)

    ticker = Instance(Ticker, has_ref=True)
    formatter = Instance(TickFormatter, has_ref=True)

    axis_label = String
    axis_label_standoff = Int
    axis_label_props = Include(TextProps, prefix="axis_label")

    major_label_standoff = Int
    major_label_orientation = Either(Enum("horizontal", "vertical"), Int)
    major_label_props = Include(TextProps, prefix="major_label")

    # Line props
    axis_props = Include(LineProps, prefix="axis")
    tick_props = Include(LineProps, prefix="major_tick")

    major_tick_in = Int
    major_tick_out = Int

class LinearAxis(Axis):
    type = String("linear_axis")

    def __init__(self, **kwargs):
        if 'ticker' not in kwargs:
            kwargs['ticker'] = BasicTicker()
        if 'formatter' not in kwargs:
            kwargs['formatter'] = BasicTickFormatter()
        super(LinearAxis, self).__init__(**kwargs)

class CategoricalAxis(Axis):
    type = String("categorical_axis")

    def __init__(self, **kwargs):
        if 'ticker' not in kwargs:
            kwargs['ticker'] = CategoricalTicker()
        if 'formatter' not in kwargs:
            kwargs['formatter'] = CategoricalTickFormatter()
        super(CategoricalAxis, self).__init__(**kwargs)

class DatetimeAxis(LinearAxis):
    type = String("datetime_axis")

    axis_label = String("date")
    scale = String("time")
    num_labels = Int(8)
    char_width = Int(10)
    fill_ratio = Float(0.3)
    formats = Dict({"days": ["%m/%d/%Y"]})

    def __init__(self, **kwargs):
        if 'ticker' not in kwargs:
            kwargs['ticker'] = DatetimeTicker()
        if 'formatter' not in kwargs:
            kwargs['formatter'] = DatetimeTickFormatter()
        super(DatetimeAxis, self).__init__(**kwargs)

class Grid(GuideRenderer):
    """ 1D Grid component """
    type = String("grid")

    dimension = Int(0)
    bounds = String('auto')

    axis = Instance(Axis, has_ref=True)

    # Line props
    grid_props = Include(LineProps, prefix="grid")

class Tool(PlotObject):
    plot = Instance(Plot, has_ref=True)

class PanTool(Tool):
    dimensions = List(Enum(Dimension))

class WheelZoomTool(Tool):
    dimensions = List(Enum(Dimension))

class PreviewSaveTool(Tool):
    pass

class EmbedTool(Tool):
    pass

class ResetTool(Tool):
    pass

class ResizeTool(Tool):
    pass

class CrosshairTool(Tool):
    pass

class BoxZoomTool(Tool):
    pass

class BoxSelectTool(Tool):
    renderers = List(Instance(Renderer), has_ref=True)
    select_every_mousemove = Bool(True)

class BoxSelectionOverlay(Renderer):
    __view_model__ = 'BoxSelection'
    tool = Instance(Tool, has_ref=True)

class HoverTool(Tool):
    renderers = List(Instance(Renderer), has_ref=True)
    tooltips = Dict()

class ObjectExplorerTool(Tool):
    pass

class DataRangeBoxSelectTool(Tool):
    xselect = List(Instance(Range), has_ref=True)
    yselect = List(Instance(Range), has_ref=True)

class Legend(Renderer):
    plot = Instance(Plot, has_ref=True)
    orientation = Enum(Orientation)
    border = Include(LineProps, prefix="border")

    label_props = Include(TextProps, prefix="label")
    label_standoff = Int(15)
    label_height = Int(20)
    label_width = Int(50)
    legend_padding = Int(10)

    glyph_height = Int(20)
    glyph_width = Int(20)
    legend_spacing = Int(3)
    legends = Dict()

class DataSlider(Renderer):
    plot = Instance(Plot, has_ref=True)
    data_source = Instance(DataSource, has_ref=True)
    field = String()

class PlotContext(PlotObject):
    children = List(Instance(Plot, has_ref=True), has_ref=True)

class PlotList(PlotContext):
    # just like plot context, except plot context has special meaning
    # everywhere, so plotlist is the generic one
    pass
