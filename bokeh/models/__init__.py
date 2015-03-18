from __future__ import absolute_import



from .actions import PlotObject, Action, OpenURL; PlotObject; Action; OpenURL
from .axes import (Axis, ContinuousAxis, LinearAxis, LogAxis, CategoricalAxis,
                   DatetimeAxis)
from .formatters import (TickFormatter, BasicTickFormatter, NumeralTickFormatter,
                         PrintfTickFormatter, LogTickFormatter,
                         CategoricalTickFormatter, DatetimeTickFormatter)
from .glyphs import (Glyph, AnnularWedge, Annulus, Arc, Bezier, Gear, Image,
                     ImageRGBA, ImageURL, Line, MultiLine, Oval, Patch, Patches,
                     Quad, Quadratic, Ray, Rect, Segment, Text, Wedge)
from .grids import Grid
from .map_plots import GMapOptions, GMapPlot, GeoJSOptions, GeoJSPlot
from .markers import (Marker, Asterisk, Circle, CircleCross, CircleX, Cross,
                      Diamond, DiamondCross, InvertedTriangle, Square,
                      SquareCross, SquareX, Triangle, X)
from .mappers import ColorMapper, LinearColorMapper
from .plots import PlotContext, PlotList, Plot, GridPlot
from .ranges import Range, Range1d, DataRange, DataRange1d, FactorRange
from .renderers import Renderer, GlyphRenderer, Legend, GuideRenderer
from .sources import (DataSource, ColumnsRef, ColumnDataSource, RemoteSource,
                      AjaxDataSource, BlazeDataSource, ServerDataSource)
from .tickers import (Ticker, AdaptiveTicker, CompositeTicker, SingleIntervalTicker,
                      DaysTicker, MonthsTicker, YearsTicker, BasicTicker, LogTicker,
                      CategoricalTicker, DatetimeTicker)
from .tools import (ToolEvents, Tool, PanTool, WheelZoomTool, PreviewSaveTool,
                    ResetTool, ResizeTool, TapTool, CrosshairTool, BoxZoomTool,
                    BoxSelectTool, BoxSelectionOverlay, LassoSelectTool,
                    PolySelectTool, HoverTool)
from .widget import Widget
from .widgets import (AbstractButton, AbstractGroup, AbstractIcon, AutocompleteInput,
                      BaseBox, BooleanFormatter, Button, ButtonGroup, CellEditor,
                      CellFormatter, CheckboxButtonGroup, CheckboxEditor,
                      CheckboxGroup, DataTable, DateEditor, DateFormatter, DatePicker,
                       DateRangeSlider, Dialog, Dropdown, Group, HBox, Icon,
                       InputWidget, IntEditor, Layout, MultiSelect, NumberEditor,
                       NumberFormatter, Panel, Paragraph, PercentEditor, PreText,
                       RadioButtonGroup, RadioGroup, Select, SelectEditor, Slider,
                       StringEditor, StringFormatter, TableColumn, TableWidget, Tabs,
                       TextEditor, TextInput, TimeEditor, Toggle, VBox, VBoxForm)

# Define __all__ to make pyflakes happy
__all__ = ["AbstractButton", "AbstractGroup", "AbstractIcon", "Action",
"AdaptiveTicker", "AjaxDataSource", "AnnularWedge", "Annulus", "Arc",
"Asterisk", "AutocompleteInput", "Axis", "BaseBox", "BasicTickFormatter",
"BasicTicker", "Bezier", "BlazeDataSource", "BooleanFormatter",
"BoxSelectTool", "BoxSelectionOverlay", "BoxZoomTool", "Button",
"ButtonGroup", "CategoricalAxis", "CategoricalTickFormatter",
"CategoricalTicker", "CellEditor", "CellFormatter", "CheckboxButtonGroup",
"CheckboxEditor", "CheckboxGroup", "Circle", "CircleCross", "CircleX",
"ColorMapper", "ColumnDataSource", "ColumnsRef", "CompositeTicker",
"ContinuousAxis", "Cross", "CrosshairTool", "DataRange", "DataRange1d",
"DataSource", "DataTable", "DateEditor", "DateFormatter", "DatePicker",
"DateRangeSlider", "DatetimeAxis", "DatetimeTickFormatter", "DatetimeTicker",
"DaysTicker", "Dialog", "Diamond", "DiamondCross", "Dropdown", "FactorRange",
"GMapOptions", "GMapPlot", "Gear", "GeoJSOptions", "GeoJSPlot", "Glyph",
"GlyphRenderer", "Grid", "GridPlot", "Group", "GuideRenderer", "HBox",
"HoverTool", "Icon", "Image", "ImageRGBA", "ImageURL", "InputWidget",
"IntEditor", "InvertedTriangle", "LassoSelectTool", "Layout", "Legend",
"Line", "LinearAxis", "LinearColorMapper", "LogAxis", "LogTickFormatter",
"LogTicker", "Marker", "MonthsTicker", "MultiLine", "MultiSelect",
"NumberEditor", "NumberFormatter", "NumeralTickFormatter", "OpenURL", "Oval",
"PanTool", "Panel", "Paragraph", "Patch", "Patches", "PercentEditor", "Plot",
"PlotContext", "PlotList", "PolySelectTool", "PreText", "PreviewSaveTool",
"PrintfTickFormatter", "Quad", "Quadratic", "RadioButtonGroup", "RadioGroup",
"Range", "Range1d", "Ray", "Rect", "RemoteSource", "Renderer", "ResetTool",
"ResizeTool", "Segment", "Select", "SelectEditor", "ServerDataSource",
"SingleIntervalTicker", "Slider", "Square", "SquareCross", "SquareX",
"StringEditor", "StringFormatter", "TableColumn", "TableWidget", "Tabs",
"TapTool", "Text", "TextEditor", "TextInput", "TickFormatter", "Ticker",
"TimeEditor", "Toggle", "Tool", "ToolEvents", "Triangle", "VBox", "VBoxForm",
"Wedge", "WheelZoomTool", "Widget", "X", "YearsTicker"]


if False:
    ##
    def get_classes_here(modname):
        # Get module
        m = __import__(modname)
        for part in  modname.split('.')[1:]:
            m = getattr(m, part)
        # Collect classes that are defined in this module (or deeper)
        classnames = []
        for name in dir(m):
            if name.startswith('_'):
                continue
            ob = getattr(m, name)
            if isinstance(ob, type):
                if ob.__module__.startswith(modname):
                    classnames.append(name)
        classnames.sort()
        return classnames
    #print(', '.join(get_classes_here('bokeh.models.widgets')))
    print('", "'.join(get_classes_here('bokeh.models')))

    

# show_classes_in('widgets/tables')


# todo: write small snippet that compiles a list of all names imported here, that we can put here to fool pyflakes