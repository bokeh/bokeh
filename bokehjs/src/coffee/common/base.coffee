
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
  "mapper/1d/log_mapper",
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
  "renderer/guide/log_axis",
  "renderer/overlay/box_selection",

  "source/column_data_source",
  "source/server_data_source",

  "ticking/abstract_ticker",
  "ticking/adaptive_ticker",
  "ticking/basic_tick_formatter",
  "ticking/basic_ticker",
  "ticking/log_ticker",
  "ticking/log_tick_formatter",
  "ticking/categorical_tick_formatter",
  "ticking/categorical_ticker",
  "ticking/composite_ticker",
  "ticking/datetime_tick_formatter",
  "ticking/datetime_ticker",
  "ticking/days_ticker",
  "ticking/months_ticker",
  "ticking/single_interval_ticker",
  "ticking/years_ticker",

  "tool/box_select_tool",
  "tool/box_zoom_tool",
  "tool/click_tool",
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
  "widget/data_table",
  "widget/handson_table",
  "widget/table_column"
  "widget/pivot_table",
  "widget/object_explorer",

  "widget/pandas/ipython_remote_data",
  "widget/pandas/pandas_pivot_table",
  "widget/pandas/pandas_plot_source",
  'widget/paragraph'
  'widget/hbox'
  'widget/vbox'
  'widget/textinput'
  'widget/vboxmodelform'
  'widget/pretext'
  'widget/selectbox'
  'widget/slider'
  'widget/crossfilter'
  'widget/volumeslicer/volumeslicer'
  'widget/multiselect'
  'widget/date_range_slider'
  'widget/date_picker'
  'widget/panel'
  'widget/tabs'
  'widget/dialog'

  'transforms/const'
  'transforms/count'
  'transforms/cuberoot'
  'transforms/id'
  'transforms/interpolate'
  'transforms/seq'
  'transforms/spread'
], (_, require) ->

  # add some useful functions to underscore
  require("common/custom").monkey_patch()

  Config = {}
  url = window.location.href
  if url.indexOf('/bokeh') > 0
    Config.prefix = url.slice(0, url.indexOf('/bokeh')) + "/" #keep trailing slash
  else
    Config.prefix = '/'
  console.log('setting prefix to', Config.prefix)

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
    LogAxis:                  'renderer/guide/log_axis'
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
    LogTicker:                'ticking/log_ticker'
    LogTickFormatter:         'ticking/log_tick_formatter'
    CategoricalTicker:        'ticking/categorical_ticker'
    CategoricalTickFormatter: 'ticking/categorical_tick_formatter'
    CompositeTicker:          'ticking/composite_ticker'
    DatetimeTicker:           'ticking/datetime_ticker'
    DatetimeTickFormatter:    'ticking/datetime_tick_formatter'
    DaysTicker:               'ticking/days_ticker'
    MonthsTicker:             'ticking/months_ticker'
    SingleIntervalTicker:     'ticking/single_interval_ticker'
    YearsTicker:              'ticking/years_ticker'

    PanTool:                  'tool/pan_tool'
    WheelZoomTool:            'tool/wheel_zoom_tool'
    ResizeTool:               'tool/resize_tool'
    ClickTool:                'tool/click_tool'
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
    DataTable:                'widget/data_table'
    HandsonTable:             'widget/handson_table'
    TableColumn:              'widget/table_column'
    PivotTable:               'widget/pivot_table'
    ObjectExplorer:           'widget/object_explorer'

    IPythonRemoteData:        'widget/pandas/ipython_remote_data'
    PandasPivotTable:         'widget/pandas/pandas_pivot_table'
    PandasPlotSource:         'widget/pandas/pandas_plot_source'
    Paragraph:                'widget/paragraph'
    HBox:                     'widget/hbox'
    VBox:                     'widget/vbox'
    VBoxModelForm:            'widget/vboxmodelform'
    TextInput:                'widget/textinput'
    PreText:                  'widget/pretext'
    Select:                   'widget/selectbox'
    Slider:                   'widget/slider'
    CrossFilter:              'widget/crossfilter'
    VolumeSlicer:             'widget/volumeslicer/volumeslicer'
    MultiSelect:              'widget/multiselect'
    DateRangeSlider:          'widget/date_range_slider'
    DatePicker:               'widget/date_picker'
    Panel:                    'widget/panel'
    Tabs:                     'widget/tabs'
    Dialog:                   'widget/dialog'

    Const:                    'transforms/const'
    Count:                    'transforms/count'
    Cuberoot:                 'transforms/cuberoot'
    Id:                       'transforms/id'
    Interpolate:              'transforms/interpolate'
    Seq:                      'transforms/seq'
    Spread:                   'transforms/spread'
  mod_cache = {}
  collection_overrides = {}
  Collections = (typename) ->
   if collection_overrides[typename]
     return collection_overrides[typename]

    if not locations[typename]
      throw "./base: Unknown Collection #{typename}"

    modulename = locations[typename]

    if not mod_cache[modulename]?
      mod = require(modulename)

      if mod?
          mod_cache[modulename] = mod
      else
          throw Error("improperly implemented collection: #{modulename}")

    return mod_cache[modulename].Collection
  Collections.register = (name, collection) ->
    collection_overrides[name] = collection
  return {
    "collection_overrides" : collection_overrides, # for testing only
    "mod_cache": mod_cache, # for testing only
    "locations": locations,
    "Collections": Collections,
    "Config" : Config
  }
