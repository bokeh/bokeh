define (require, exports, module) ->

  if not window.Float64Array
    console.warn("Float64Array is not supported. Using generic Array instead.")
    window.Float64Array = Array

  Bokeh = {}

  Bokeh.version = '0.4.2'

  # common
  Bokeh.Collections       = require("common/base").Collections
  Bokeh.Config            = require("common/base").Config
  Bokeh.GMapPlot          = require("common/gmap_plot")
  Bokeh.GridPlot          = require("common/grid_plot")
  Bokeh.HasParent         = require("common/has_parent")
  Bokeh.HasProperties     = require("common/has_properties")
  Bokeh.Plot              = require("common/plot")
  Bokeh.Plotting          = require("common/plotting")

  Bokeh.Affine = require("common/affine")
  Bokeh.build_views = require("common/build_views")
  Bokeh.bulk_save = require("common/bulk_save")
  Bokeh.ContinuumView = require("common/continuum_view")
  Bokeh.GridViewState = require("common/grid_view_state")
  Bokeh.load_models = require("common/load_models")
  Bokeh.PlotContext = require("common/plot_context")
  Bokeh.PlotWidget = require("common/plot_widget")
  Bokeh.PNGView = require("common/png_view")
  Bokeh.Random = require("common/random")
  Bokeh.safebind = require("common/safebind")
  Bokeh.SVGColors = require("common/svg_colors")
  Bokeh.ViewState = require("common/view_state")

  # mappers
  Bokeh.LinearMapper      = require("mapper/1d/linear_mapper")
  Bokeh.CategoricalMapper = require("mapper/1d/categorical_mapper")
  Bokeh.GridMapper        = require("mapper/2d/grid_mapper")
  Bokeh.LinearColorMapper = require("mapper/color/linear_color_mapper")

  # palettes
  Bokeh.Palettes = require("palettes/palettes")

  # annotations
  Bokeh.Legend = require("renderer/annotation/legend")

  # glyphs
  Bokeh.Glyph = require("renderer/glyph/glyph")
  glyph_factory = require("renderer/glyph/glyph_factory")
  Bokeh.AnnularWedge     = glyph_factory.annular_wedge
  Bokeh.Annulus          = glyph_factory.annulus
  Bokeh.Arc              = glyph_factory.arc
  Bokeh.Asterisk         = glyph_factory.asterisk
  Bokeh.Bezier           = glyph_factory.bezier
  Bokeh.Circle           = glyph_factory.circle
  Bokeh.CircleCross      = glyph_factory.circle_cross
  Bokeh.CircleX          = glyph_factory.circle_x
  Bokeh.Cross            = glyph_factory.cross
  Bokeh.Diamond          = glyph_factory.diamond
  Bokeh.DiamondCross     = glyph_factory.diamond_cross
  Bokeh.Image            = glyph_factory.image
  Bokeh.ImageRGBA        = glyph_factory.image_rgba
  Bokeh.ImageURI         = glyph_factory.image_uri
  Bokeh.InvertedTriangle = glyph_factory.inverted_triangle
  Bokeh.Line             = glyph_factory.line
  Bokeh.MultiLine        = glyph_factory.multi_line
  Bokeh.Oval             = glyph_factory.oval
  Bokeh.Patch            = glyph_factory.patch
  Bokeh.Patches          = glyph_factory.patches
  Bokeh.Quad             = glyph_factory.quad
  Bokeh.Quadratic        = glyph_factory.quadratic
  Bokeh.Ray              = glyph_factory.ray
  Bokeh.Rect             = glyph_factory.rect
  Bokeh.Segment          = glyph_factory.segment
  Bokeh.Square           = glyph_factory.square
  Bokeh.SquareCross      = glyph_factory.square_cross
  Bokeh.SquareX          = glyph_factory.square_x
  Bokeh.Text             = glyph_factory.text
  Bokeh.Triangle         = glyph_factory.triangle
  Bokeh.Wedge            = glyph_factory.wedge
  Bokeh.X                = glyph_factory.x

  # guides
  Bokeh.CategoricalAxis = require("renderer/guide/categorical_axis")
  Bokeh.DatetimeAxis    = require("renderer/guide/datetime_axis")
  Bokeh.Grid            = require("renderer/guide/grid")
  Bokeh.LinearAxis      = require("renderer/guide/linear_axis")

  # overlays
  Bokeh.BoxSelection = require("renderer/overlay/box_selection")

  Bokeh.Properties = require("renderer/properties")

  # server tools
  Bokeh.embed_core  = require("server/embed_core")
  Bokeh.serverrun   = require("server/serverrun")
  Bokeh.serverutils = require("server/serverutils")

  # data sources
  Bokeh.ColumnDataSource      = require("source/column_data_source")

  # tickers and tick formatters
  Bokeh.AbstractTicker           = require("ticking/abstract_ticker")
  Bokeh.AdaptiveTicker           = require("ticking/adaptive_ticker")
  Bokeh.BasicTicker              = require("ticking/basic_ticker")
  Bokeh.BasicTickFormatter       = require("ticking/basic_tick_formatter")
  Bokeh.CategoricalTicker        = require("ticking/categorical_ticker")
  Bokeh.CategoricalTickFormatter = require("ticking/categorical_tick_formatter")
  Bokeh.CompositeTicker          = require("ticking/composite_ticker")
  Bokeh.DatetimeTicker           = require("ticking/datetime_ticker")
  Bokeh.DatetimeTickFormatter    = require("ticking/datetime_tick_formatter")
  Bokeh.DaysTicker               = require("ticking/days_ticker")
  Bokeh.MonthsTicker             = require("ticking/months_ticker")
  Bokeh.SingleIntervalTicker     = require("ticking/single_interval_ticker")
  Bokeh.YearsTicker              = require("ticking/years_ticker")

  # tools
  Bokeh.BoxSelectTool          = require("tool/box_select_tool")
  Bokeh.BoxZoomTool            = require("tool/box_zoom_tool")
  Bokeh.CrosshairTool          = require("tool/crosshair_tool")
  Bokeh.DataRangeBoxSelectTool = require("tool/data_range_box_select_tool")
  Bokeh.EmbedTool              = require("tool/embed_tool")
  Bokeh.HoverTool              = require("tool/hover_tool")
  Bokeh.PanTool                = require("tool/pan_tool")
  Bokeh.PreviewSaveTool        = require("tool/preview_save_tool")
  Bokeh.ResetTool              = require("tool/reset_tool")
  Bokeh.ResizeTool             = require("tool/resize_tool")
  Bokeh.WheelZoomTool          = require("tool/wheel_zoom_tool")
  Bokeh.ObjectExplorerTool     = require("tool/object_explorer_tool")

  # widgets
  Bokeh.DataSlider = require("widget/data_slider")
  Bokeh.server_page = require("server/serverrun").load

  # utils
  Bokeh.ObjectExplorer = require("util/object_explorer")

  exports.Bokeh = Bokeh

  return Bokeh
