define (require, exports, module) ->

  Bokeh = {}
  Bokeh.require = require
  Bokeh.version = '0.5.2'

  # set up logger
  logging = require("common/logging")
  Bokeh.logger = logging.logger
  Bokeh.set_log_level = logging.set_log_level

  # fallback to Array if necessary
  if not window.Float64Array
    Bokeh.logger.warn("Float64Array is not supported. Using generic Array instead.")
    window.Float64Array = Array

  # binding the libs that bokeh uses so others can reference them
  Bokeh._                 = require("underscore")
  Bokeh.$                 = require("jquery")
  Bokeh.Backbone          = require("backbone")

  # Make sure that we don't clobber any existing definition of $ (most
  # likely a previous version of jQuery.
  _oldJQ = window.$
  window.jQuery.noConflict()
  if typeof($) == "undefined"
    # if there was no previous definition of $, put our definition into window.$.
    window.$ = _oldJQ

  # common
  Bokeh.Collections       = require("common/base").Collections
  Bokeh.Config            = require("common/base").Config
  Bokeh.CartesianFrame    = require("common/cartesian_frame")
  Bokeh.Canvas            = require("common/canvas")
  Bokeh.GMapPlot          = require("common/gmap_plot")
  Bokeh.GridPlot          = require("common/grid_plot")
  Bokeh.HasParent         = require("common/has_parent")
  Bokeh.HasProperties     = require("common/has_properties")
  Bokeh.LayoutBox         = require("common/layout_box")
  Bokeh.Plot              = require("common/plot")
  Bokeh.Plotting          = require("common/plotting")

  Bokeh.build_views   = require("common/build_views")
  Bokeh.bulk_save     = require("common/bulk_save")
  Bokeh.ContinuumView = require("common/continuum_view")
  Bokeh.GridViewState = require("common/grid_view_state")
  Bokeh.load_models   = require("common/load_models")
  Bokeh.PlotContext   = require("common/plot_context")
  Bokeh.PlotWidget    = require("common/plot_widget")
  Bokeh.Random        = require("common/random")
  Bokeh.SVGColors     = require("common/svg_colors")

  # mappers
  Bokeh.LinearMapper      = require("mapper/linear_mapper")
  Bokeh.LogMapper         = require("mapper/log_mapper")
  Bokeh.CategoricalMapper = require("mapper/categorical_mapper")
  Bokeh.GridMapper        = require("mapper/grid_mapper")
  Bokeh.LinearColorMapper = require("mapper/linear_color_mapper")

  # palettes
  Bokeh.Palettes = require("palettes/palettes")

  # annotations
  Bokeh.Legend = require("renderer/annotation/legend")

  # glyphs
  Bokeh.Glyph   = require("renderer/glyph/glyph")
  glyph_factory = require("renderer/glyph/glyph_factory")

  # guides
  Bokeh.CategoricalAxis = require("renderer/guide/categorical_axis")
  Bokeh.DatetimeAxis    = require("renderer/guide/datetime_axis")
  Bokeh.Grid            = require("renderer/guide/grid")
  Bokeh.LinearAxis      = require("renderer/guide/linear_axis")
  Bokeh.LogAxis         = require("renderer/guide/log_axis")

  # overlays
  Bokeh.BoxSelection = require("renderer/overlay/box_selection")

  # properties
  Bokeh.Properties = require("renderer/properties")

  # server tools
  Bokeh.embed       = require("server/embed")
  Bokeh.serverutils = require("server/serverutils")

  # data sources
  Bokeh.ColumnDataSource = require("source/column_data_source")

  # tickers and tick formatters
  Bokeh.AbstractTicker           = require("ticking/abstract_ticker")
  Bokeh.AdaptiveTicker           = require("ticking/adaptive_ticker")
  Bokeh.BasicTicker              = require("ticking/basic_ticker")
  Bokeh.BasicTickFormatter       = require("ticking/basic_tick_formatter")
  Bokeh.LogTicker                = require("ticking/log_ticker")
  Bokeh.LogTickFormatter         = require("ticking/log_tick_formatter")
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
  Bokeh.ClickTool              = require("tool/click_tool")
  Bokeh.CrosshairTool          = require("tool/crosshair_tool")
  Bokeh.DataRangeBoxSelectTool = require("tool/data_range_box_select_tool")
  Bokeh.HoverTool              = require("tool/hover_tool")
  Bokeh.PanTool                = require("tool/pan_tool")
  Bokeh.PreviewSaveTool        = require("tool/preview_save_tool")
  Bokeh.ResetTool              = require("tool/reset_tool")
  Bokeh.ResizeTool             = require("tool/resize_tool")
  Bokeh.WheelZoomTool          = require("tool/wheel_zoom_tool")
  Bokeh.ObjectExplorerTool     = require("tool/object_explorer_tool")

  # widgets
  Bokeh.HBox           = require("widget/hbox")
  Bokeh.VBox           = require("widget/vbox")
  Bokeh.TextInput      = require("widget/textinput")
  Bokeh.CrossFilter    = require("widget/crossfilter")
  Bokeh.ObjectExplorer = require("widget/object_explorer")

  exports.Bokeh = Bokeh

  return Bokeh
