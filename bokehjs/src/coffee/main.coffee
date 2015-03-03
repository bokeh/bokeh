define (require, exports, module) ->

  Bokeh = {}
  Bokeh.require = require
  Bokeh.version = '0.8.1'

  Bokeh.index = require("common/base").index

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
  Bokeh.$                 = require("jquery-private")
  Bokeh.Backbone          = require("backbone")

  # common
  Bokeh.Collections       = require("common/base").Collections
  Bokeh.Config            = require("common/base").Config
  Bokeh.CartesianFrame    = require("common/cartesian_frame")
  Bokeh.Canvas            = require("common/canvas")
  Bokeh.GMapPlot          = require("common/gmap_plot")
  Bokeh.GeoJSPlot         = require("common/geojs_plot")
  Bokeh.GridPlot          = require("common/grid_plot")
  Bokeh.HasParent         = require("common/has_parent")
  Bokeh.HasProperties     = require("common/has_properties")
  Bokeh.LayoutBox         = require("common/layout_box")
  Bokeh.Plot              = require("common/plot")
  Bokeh.SelectionManager  = require("common/selection_manager")
  Bokeh.Selector          = require("common/selector")
  Bokeh.ToolEvents        = require("common/tool_events")

  Bokeh.build_views   = require("common/build_views")
  Bokeh.bulk_save     = require("common/bulk_save")
  Bokeh.ContinuumView = require("common/continuum_view")
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
  Bokeh.Legend  = require("renderer/annotation/legend")
  Bokeh.Span    = require("renderer/annotation/span")
  Bokeh.Tooltip = require("renderer/annotation/tooltip")

  # glyphs
  # ...

  # guides
  Bokeh.CategoricalAxis = require("renderer/guide/categorical_axis")
  Bokeh.DatetimeAxis    = require("renderer/guide/datetime_axis")
  Bokeh.Grid            = require("renderer/guide/grid")
  Bokeh.LinearAxis      = require("renderer/guide/linear_axis")
  Bokeh.LogAxis         = require("renderer/guide/log_axis")

  # overlays
  Bokeh.BoxSelection  = require("renderer/overlay/box_selection")
  Bokeh.PolySelection = require("renderer/overlay/poly_selection")

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
  Bokeh.ActionTool             = require("tool/actions/action_tool")
  Bokeh.PreviewSaveTool        = require("tool/actions/preview_save_tool")
  Bokeh.ResetTool              = require("tool/actions/reset_tool")

  Bokeh.BoxSelectTool          = require("tool/gestures/box_select_tool")
  Bokeh.BoxZoomTool            = require("tool/gestures/box_zoom_tool")
  Bokeh.LassoSelectTool        = require("tool/gestures/lasso_select_tool")
  Bokeh.PanTool                = require("tool/gestures/pan_tool")
  Bokeh.PolySelectTool         = require("tool/gestures/poly_select_tool")
  Bokeh.ResizeTool             = require("tool/gestures/resize_tool")
  Bokeh.SelectTool             = require("tool/gestures/select_tool")
  Bokeh.TapTool                = require("tool/gestures/tap_tool")
  Bokeh.WheelZoomTool          = require("tool/gestures/wheel_zoom_tool")

  Bokeh.InspectTool            = require("tool/inspectors/inspect_tool")
  Bokeh.HoverTool              = require("tool/inspectors/hover_tool")
  Bokeh.CrosshairTool          = require("tool/inspectors/crosshair_tool")

  # widgets
  Bokeh.HBox           = require("widget/hbox")
  Bokeh.VBox           = require("widget/vbox")
  Bokeh.TextInput      = require("widget/text_input")
  Bokeh.CrossFilter    = require("widget/crossfilter")

  # Add the jquery plugin
  require("api/plugin")

  exports.Bokeh = Bokeh

  return Bokeh
