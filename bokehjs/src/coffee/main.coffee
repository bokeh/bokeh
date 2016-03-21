Bokeh = {}
Bokeh.require = require
Bokeh.version = '0.11.1'

# binding the libs that bokeh uses so others can reference them
Bokeh._                 = require("underscore")
Bokeh.$                 = require("jquery")

Bokeh.Backbone          = require("backbone")
Bokeh.Backbone.$        = Bokeh.$

# set up logger
logging = require("./core/logging")
Bokeh.logger            = logging.logger
Bokeh.set_log_level     = logging.set_log_level

# fallback to Array if necessary
if not window.Float64Array
  Bokeh.logger.warn("Float64Array is not supported. Using generic Array instead.")
  window.Float64Array = Array

Bokeh.index             = require("./base").index
Bokeh.embed             = require("./embed")

Bokeh.Collections       = require("./base").Collections
Bokeh.Config            = require("./base").Config

## {{{
## api/linalg.ts
Bokeh.LinAlg = require("./api/linalg")

## api/typings/models/document.d.ts
Bokeh.Document = require("./document").Document

## api/typings/models/annotations.d.ts
Bokeh.Annotation = require("./models/annotations/annotation").Model
Bokeh.Legend = require("./models/annotations/legend").Model
Bokeh.BoxAnnotation = require("./models/annotations/box_annotation").Model
Bokeh.PolyAnnotation = require("./models/annotations/poly_annotation").Model
Bokeh.Span = require("./models/annotations/span").Model
#Bokeh.Overlay = require("./models/annotations/overlay").Model
Bokeh.Tooltip = require("./models/annotations/tooltip").Model
## api/typings/models/axes.d.ts
Bokeh.Axis = require("./models/axes/axis").Model
Bokeh.ContinuousAxis = require("./models/axes/continuous_axis").Model
Bokeh.LinearAxis = require("./models/axes/linear_axis").Model
Bokeh.LogAxis = require("./models/axes/log_axis").Model
Bokeh.CategoricalAxis = require("./models/axes/categorical_axis").Model
Bokeh.DatetimeAxis = require("./models/axes/datetime_axis").Model
## api/typings/models/callbacks.d.ts
#Bokeh.Callback = require("./models/callbacks/callback").Model
Bokeh.OpenURL = require("./models/callbacks/open_url").Model
Bokeh.CustomJS = require("./models/callbacks/customjs").Model
## api/typings/models/component.d.ts
Component = require("./models/component").Model
## api/typings/models/formatters.d.ts
Bokeh.TickFormatter = require("./models/formatters/tick_formatter").Model
Bokeh.BasicTickFormatter = require("./models/formatters/basic_tick_formatter").Model
Bokeh.LogTickFormatter = require("./models/formatters/basic_tick_formatter").Model
Bokeh.CategoricalTickFormatter = require("./models/formatters/categorical_tick_formatter").Model
Bokeh.DatetimeTickFormatter = require("./models/formatters/datetime_tick_formatter").Model
Bokeh.NumeralTickFormatter = require("./models/formatters/numeral_tick_formatter").Model
Bokeh.PrintfTickFormatter = require("./models/formatters/printf_tick_formatter").Model
## api/typings/models/glyphs.d.ts
Bokeh.Glyph = require("./models/glyphs/glyph").Model
Bokeh.AnnularWedge = require("./models/glyphs/annular_wedge").Model
Bokeh.Annulus = require("./models/glyphs/annulus").Model
Bokeh.Arc = require("./models/glyphs/arc").Model
Bokeh.Bezier = require("./models/glyphs/bezier").Model
Bokeh.ImageRGBA = require("./models/glyphs/image_rgba").Model
Bokeh.Image = require("./models/glyphs/image").Model
Bokeh.ImageURL = require("./models/glyphs/image_url").Model
Bokeh.Line = require("./models/glyphs/line").Model
Bokeh.MultiLine = require("./models/glyphs/multi_line").Model
Bokeh.Oval = require("./models/glyphs/oval").Model
Bokeh.Patch = require("./models/glyphs/patch").Model
Bokeh.Patches = require("./models/glyphs/patches").Model
Bokeh.Quad = require("./models/glyphs/quad").Model
Bokeh.Quadratic = require("./models/glyphs/quadratic").Model
Bokeh.Ray = require("./models/glyphs/ray").Model
Bokeh.Rect = require("./models/glyphs/rect").Model
Bokeh.Segment = require("./models/glyphs/segment").Model
Bokeh.Text = require("./models/glyphs/text").Model
Bokeh.Wedge = require("./models/glyphs/wedge").Model
Bokeh.Gear = require("./models/glyphs/gear").Model
## api/typings/models/grids.d.ts
Bokeh.Grid = require("./models/grids/grid").Model
## api/typings/models/images.d.ts
Bokeh.ImageSource = require("./models/tiles/image_source").Model
## api/typings/models/layouts.d.ts
Bokeh.Layout = require("./models/layouts/layout").Model
#Bokeh.BaseBox = require("./models/layouts/base_box").Model
Bokeh.HBox = require("./models/layouts/hbox").Model
Bokeh.VBox = require("./models/layouts/vbox").Model
## api/typings/models/map_plots.d.ts
Bokeh.GMapPlot = require("./models/plots/gmap_plot").Model
## api/typings/models/mappers.d.ts
#Bokeh.ColorMapper = require("./models/mappers/color_mapper").Model
Bokeh.LinearColorMapper = require("./models/mappers/linear_color_mapper").Model
## api/typings/models/markers.d.ts
Bokeh.Marker = require("./models/markers/marker").Model
Bokeh.Asterisk = require("./models/markers/asterisk").Model
Bokeh.Circle = require("./models/glyphs/circle").Model
Bokeh.CircleCross = require("./models/markers/circle_cross").Model
Bokeh.CircleX = require("./models/markers/circle_x").Model
Bokeh.Cross = require("./models/markers/cross").Model
Bokeh.Diamond = require("./models/markers/diamond").Model
Bokeh.DiamondCross = require("./models/markers/diamond_cross").Model
Bokeh.InvertedTriangle = require("./models/markers/inverted_triangle").Model
Bokeh.Square = require("./models/markers/square").Model
Bokeh.SquareCross = require("./models/markers/square_cross").Model
Bokeh.SquareX = require("./models/markers/square_x").Model
Bokeh.Triangle = require("./models/markers/triangle").Model
Bokeh.X = require("./models/markers/x").Model
## api/typings/models/model.d.ts
Bokeh.Model = require("./model").Model
## api/typings/models/plots.d.ts
Bokeh.Plot = require("./models/plots/plot").Model
Bokeh.GridPlot = require("./models/layouts/grid_plot").Model
## api/typings/models/ranges.d.ts
Bokeh.Range = require("./models/ranges/range").Model
Bokeh.Range1d = require("./models/ranges/range1d").Model
Bokeh.DataRange = require("./models/ranges/data_range").Model
Bokeh.DataRange1d = require("./models/ranges/data_range1d").Model
Bokeh.FactorRange = require("./models/ranges/factor_range").Model
## api/typings/models/renderers.d.ts
Bokeh.Renderer = require("./models/renderers/renderer").Model
#Bokeh.DataRenderer = require("./models/renderers/data_renderer").Model
Bokeh.TileRenderer = require("./models/tiles/tile_renderer").Model
Bokeh.DynamicImageRenderer = require("./models/tiles/dynamic_image_renderer").Model
Bokeh.GlyphRenderer = require("./models/renderers/glyph_renderer").Model
Bokeh.GuideRenderer = require("./models/renderers/guide_renderer").Model
## api/typings/models/sources.d.ts
Bokeh.DataSource = require("./models/sources/data_source").Model
Bokeh.ColumnDataSource = require("./models/sources/column_data_source").Model
#Bokeh.RemoteSource = require("./models/sources/remote_source").Model
Bokeh.AjaxDataSource = require("./models/sources/ajax_data_source").Model
## api/typings/models/tickers.d.ts
Bokeh.Ticker = require("./models/tickers/ticker").Model
Bokeh.FixedTicker = require("./models/tickers/fixed_ticker").Model
Bokeh.AdaptiveTicker = require("./models/tickers/adaptive_ticker").Model
Bokeh.CompositeTicker = require("./models/tickers/composite_ticker").Model
Bokeh.SingleIntervalTicker = require("./models/tickers/single_interval_ticker").Model
Bokeh.DaysTicker = require("./models/tickers/days_ticker").Model
Bokeh.MonthsTicker = require("./models/tickers/months_ticker").Model
Bokeh.YearsTicker = require("./models/tickers/years_ticker").Model
Bokeh.BasicTicker = require("./models/tickers/basic_ticker").Model
Bokeh.LogTicker = require("./models/tickers/log_ticker").Model
Bokeh.CategoricalTicker = require("./models/tickers/categorical_ticker").Model
Bokeh.DatetimeTicker = require("./models/tickers/datetime_ticker").Model
## api/typings/models/tiles.d.ts
Bokeh.TileSource = require("./models/tiles/tile_source").Model
Bokeh.MercatorTileSource = require("./models/tiles/mercator_tile_source").Model
Bokeh.TMSTileSource = require("./models/tiles/tms_tile_source").Model
Bokeh.WMTSTileSource = require("./models/tiles/wmts_tile_source").Model
Bokeh.QUADKEYTileSource = require("./models/tiles/quadkey_tile_source").Model
Bokeh.BBoxTileSource = require("./models/tiles/bbox_tile_source").Model
## api/typings/models/tools.d.ts
Bokeh.ToolEvents = require("./common/tool_events").Model
Bokeh.Tool = require("./models/tools/tool").Model
Bokeh.PanTool = require("./models/tools/gestures/pan_tool").Model
Bokeh.WheelZoomTool = require("./models/tools/gestures/wheel_zoom_tool").Model
Bokeh.PreviewSaveTool = require("./models/tools/actions/preview_save_tool").Model
Bokeh.UndoTool = require("./models/tools/actions/undo_tool").Model
Bokeh.RedoTool = require("./models/tools/actions/redo_tool").Model
Bokeh.ResetTool = require("./models/tools/actions/reset_tool").Model
Bokeh.ResizeTool = require("./models/tools/gestures/resize_tool").Model
Bokeh.CrosshairTool = require("./models/tools/inspectors/crosshair_tool").Model
Bokeh.BoxZoomTool = require("./models/tools/gestures/box_zoom_tool").Model
Bokeh.BoxSelectTool = require("./models/tools/gestures/box_select_tool").Model
Bokeh.LassoSelectTool = require("./models/tools/gestures/lasso_select_tool").Model
Bokeh.PolySelectTool = require("./models/tools/gestures/poly_select_tool").Model
Bokeh.TapTool = require("./models/tools/gestures/tap_tool").Model
Bokeh.HoverTool = require("./models/tools/inspectors/hover_tool").Model
Bokeh.HelpTool = require("./models/tools/actions/help_tool").Model
## }}}

# Here for backwards capability?
Bokeh.Bokeh = Bokeh
module.exports = Bokeh
