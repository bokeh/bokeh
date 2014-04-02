
define [
  "underscore",
  "require",

  "common/custom"
  "common/gmap_plot",
  "common/grid_plot",
  "common/plot",
  "common/plot_context",

  "mapper/1d/categorical_mapper",
  "mapper/1d/linear_mapper",
  "mapper/2d/grid_mapper",
  "mapper/color/linear_color_mapper",

  "range/data_factor_range",
  "range/data_range1d",
  "range/factor_range",
  "range/range1d",

  "renderer/annotation/legend",
  "renderer/glyph/glyph_factory",
  "renderer/guide/categorical_axis",
  "renderer/guide/datetime_axis",
  "renderer/guide/grid",
  "renderer/guide/linear_axis",
  "renderer/overlay/box_selection",

  "source/column_data_source",
  "source/server_data_source",

  "ticking/abstract_ticker",
  "ticking/adaptive_ticker",
  "ticking/basic_tick_formatter",
  "ticking/basic_ticker",
  "ticking/categorical_tick_formatter",
  "ticking/categorical_ticker",
  "ticking/composite_ticker",
  "ticking/datetime_tick_formatter",
  "ticking/datetime_ticker",
  "ticking/days_ticker",
  "ticking/months_ticker",
  "ticking/single_interval_ticker",

  "tool/box_select_tool",
  "tool/box_zoom_tool",
  "tool/crosshair_tool",
  "tool/data_range_box_select_tool",
  "tool/embed_tool",
  "tool/hover_tool",
  "tool/pan_tool",
  "tool/preview_save_tool",
  "tool/reset_tool",
  "tool/resize_tool",
  "tool/wheel_zoom_tool",
  "tool/object_explorer_tool",

  "widget/data_slider",
  "widget/pandas/ipython_remote_data",
  "widget/pandas/pandas_pivot_table",
  "widget/pandas/pandas_plot_source",
], (_, require) ->

  # add some useful functions to underscore
  require("common/custom").monkey_patch()

  Config =
    prefix : ''

  locations =

    Plot:                     'common/plot'
    GMapPlot:                 'common/gmap_plot'
    GridPlot:                 'common/grid_plot'
    PlotContext:              'common/plot_context'
    PlotList:                 'common/plot_context'

    DataFactorRange:          'range/data_factor_range'
    DataRange1d:              'range/data_range1d'
    FactorRange:              'range/factor_range'
    Range1d:                  'range/range1d'

    Glyph:                    'renderer/glyph/glyph_factory'
    LinearAxis:               'renderer/guide/linear_axis'
    CategoricalAxis:          'renderer/guide/categorical_axis'
    DatetimeAxis:             'renderer/guide/datetime_axis'
    Grid:                     'renderer/guide/grid'
    Legend:                   'renderer/annotation/legend'
    BoxSelection:             'renderer/overlay/box_selection'

    ColumnDataSource:         'source/column_data_source'
    ServerDataSource:         'source/server_data_source'

    AbstractTicker:           'ticking/abstract_ticker'
    AdaptiveTicker:           'ticking/adaptive_ticker'
    BasicTicker:              'ticking/basic_ticker'
    BasicTickFormatter:       'ticking/basic_tick_formatter'
    CategoricalTicker:        'ticking/categorical_ticker'
    CategoricalTickFormatter: 'ticking/categorical_tick_formatter'
    CompositeTicker:          'ticking/composite_ticker'
    DatetimeTicker:           'ticking/datetime_ticker'
    DatetimeTickFormatter:    'ticking/datetime_tick_formatter'
    DaysTicker:               'ticking/days_ticker'
    MonthsTicker:             'ticking/months_ticker'
    SingleIntervalTicker:     'ticking/single_interval_ticker'

    PanTool:                  'tool/pan_tool'
    WheelZoomTool:            'tool/wheel_zoom_tool'
    ResizeTool:               'tool/resize_tool'
    CrosshairTool:            'tool/crosshair_tool'
    BoxSelectTool:            'tool/box_select_tool'
    BoxZoomTool:              'tool/box_zoom_tool'
    HoverTool:                'tool/hover_tool'
    DataRangeBoxSelectTool:   'tool/data_range_box_select_tool'
    PreviewSaveTool:          'tool/preview_save_tool'
    EmbedTool:                'tool/embed_tool'
    ResetTool:                'tool/reset_tool'
    ObjectExplorerTool:       'tool/object_explorer_tool'

    DataSlider:               'widget/data_slider'
    IPythonRemoteData:        'widget/pandas/ipython_remote_data'
    PandasPivotTable:         'widget/pandas/pandas_pivot_table'
    PandasPlotSource:         'widget/pandas/pandas_plot_source'

  mod_cache = {}

  Collections = (typename) ->

    if not locations[typename]
      throw "./base: Unknown Collection #{typename}"

    modulename = locations[typename]

    if not mod_cache[modulename]?
      console.log("calling require", modulename)
      mod_cache[modulename] = require(modulename)

    return mod_cache[modulename].Collection

  return {
    "mod_cache": mod_cache, # for testing only
    "locations": locations,
    "Collections": Collections,
    "Config" : Config
  }
