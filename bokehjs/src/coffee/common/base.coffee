
define [
  "underscore",
  "require",
  "common/custom"
  "common/plot",
  "common/gmap_plot",
  "common/grid_plot",
  "common/plot_context",
  "range/range1d",
  "range/data_range1d",
  "range/factor_range",
  "range/data_factor_range",
  "renderer/glyph/glyph_factory",
  "renderer/guide/linear_axis",
  "renderer/guide/datetime_axis",
  "renderer/guide/grid",
  "renderer/annotation/legend",
  "renderer/overlay/box_selection",
  "source/object_array_data_source",
  "source/column_data_source",
  "tool/pan_tool",
  "tool/wheel_zoom_tool",
  "tool/resize_tool",
  "tool/crosshair_tool",
  "tool/box_select_tool",
  "tool/data_range_box_select_tool",
  "tool/preview_save_tool",
  "tool/embed_tool",
  "tool/reset_tool",
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

    Plot:                   'common/plot'
    GMapPlot:               'common/gmap_plot'
    GridPlot:               'common/grid_plot'
    CDXPlotContext:         'common/plot_context'
    PlotContext:            'common/plot_context'
    PlotList:               'common/plot_context'

    Range1d:                'range/range1d'
    DataRange1d:            'range/data_range1d'
    FactorRange:            'range/factor_range'
    DataFactorRange:        'range/data_factor_range'

    Glyph:                  'renderer/glyph/glyph_factory'
    LinearAxis:             'renderer/guide/linear_axis'
    DatetimeAxis:           'renderer/guide/datetime_axis'
    Grid:                   'renderer/guide/grid'
    Legend:                 'renderer/annotation/legend'
    BoxSelection:           'renderer/overlay/box_selection'

    ObjectArrayDataSource:  'source/object_array_data_source'
    ColumnDataSource:       'source/column_data_source'

    PanTool:                'tool/pan_tool'
    WheelZoomTool:          'tool/wheel_zoom_tool'
    ResizeTool:             'tool/resize_tool'
    CrosshairTool:          'tool/crosshair_tool'
    BoxSelectTool:          'tool/box_select_tool'
    BoxZoomTool:            'tool/box_zoom_tool'
    DataRangeBoxSelectTool: 'tool/data_range_box_select_tool'
    PreviewSaveTool:        'tool/preview_save_tool'
    EmbedTool:              'tool/embed_tool'
    ResetTool:              'tool/reset_tool'

    DataSlider:             'widget/data_slider'
    IPythonRemoteData:      'widget/pandas/ipython_remote_data'
    PandasPivotTable:       'widget/pandas/pandas_pivot_table'
    PandasPlotSource:       'widget/pandas/pandas_plot_source'

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
