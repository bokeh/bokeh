
define [
  "underscore",
  "require",

  "common/custom",
  "common/canvas",
  "common/cartesian_frame",
  "common/gmap_plot",
  "common/grid_plot",
  "common/layout_box",
  "common/plot",
  "common/plot_context",
  "common/selection_manager",
  "common/selector",

  "mapper/categorical_mapper",
  "mapper/linear_mapper",
  "mapper/log_mapper",
  "mapper/grid_mapper",
  "mapper/linear_color_mapper",

  "range/data_factor_range",
  "range/data_range1d",
  "range/factor_range",
  "range/range1d",

  "renderer/annotation/legend",
  "renderer/annotation/span",
  "renderer/annotation/tooltip",
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

  "tool/action_tool",
  "tool/inspect_tool",
  "tool/select_tool",
  "tool/actions/box_select_tool",
  "tool/actions/box_zoom_tool",
  "tool/actions/object_explorer_tool",
  "tool/actions/pan_tool",
  "tool/actions/preview_save_tool",
  "tool/actions/reset_tool",
  "tool/actions/resize_tool",
  "tool/actions/wheel_zoom_tool",
  "tool/inspectors/crosshair_tool",
  "tool/inspectors/hover_tool",

  "widget/data_table",
  "widget/handson_table",
  "widget/table_column"
  "widget/pivot_table",
  "widget/object_explorer",

  'widget/paragraph'
  'widget/hbox'
  'widget/vbox'
  'widget/textinput'
  'widget/vboxform'
  'widget/pretext'
  'widget/selectbox'
  'widget/slider'
  'widget/crossfilter'
  'widget/multiselect'
  'widget/date_range_slider'
  'widget/date_picker'
  'widget/panel'
  'widget/tabs'
  'widget/dialog'
  'widget/icon'
  'widget/button'
  'widget/toggle'
  'widget/dropdown'
  'widget/checkbox_group'
  'widget/radio_group'
  'widget/checkbox_button_group'
  'widget/radio_button_group'

  'transforms/autoencode'
  'transforms/binarysegment'
  'transforms/const'
  'transforms/contour'
  'transforms/count'
  'transforms/countcategories'
  'transforms/encode'
  'transforms/cuberoot'
  'transforms/hdalpha'
  'transforms/id'
  'transforms/interpolate'
  'transforms/interpolatecolor'
  'transforms/log'
  'transforms/nonzero'
  'transforms/ratio'
  'transforms/seq'
  'transforms/spread'
  'transforms/tocounts'
], (_, require) ->

  # add some useful functions to underscore
  require("common/custom").monkey_patch()

  Config = {}
  url = window.location.href
  if url.indexOf('/bokeh') > 0
    Config.prefix = url.slice(0, url.indexOf('/bokeh')) + "/" #keep trailing slash
  else
    Config.prefix = '/'
  console.log('Bokeh: setting prefix to', Config.prefix)

  locations =

    Plot:                     'common/plot'
    GMapPlot:                 'common/gmap_plot'
    GridPlot:                 'common/grid_plot'
    PlotContext:              'common/plot_context'
    PlotList:                 'common/plot_context'
    Canvas:                   'common/canvas'
    LayoutBox:                'common/layout_box'
    CartesianFrame:           'common/cartesian_frame'
    SelectionManager:         'common/selection_manager'
    Selector:                 'common/selector'

    DataFactorRange:          'range/data_factor_range'
    DataRange1d:              'range/data_range1d'
    FactorRange:              'range/factor_range'
    Range1d:                  'range/range1d'

    Legend:                   'renderer/annotation/legend'
    Span:                     'renderer/annotation/span'
    Tooltip:                  'renderer/annotation/tooltip'
    Glyph:                    'renderer/glyph/glyph_factory'
    LinearAxis:               'renderer/guide/linear_axis'
    LogAxis:                  'renderer/guide/log_axis'
    CategoricalAxis:          'renderer/guide/categorical_axis'
    DatetimeAxis:             'renderer/guide/datetime_axis'
    Grid:                     'renderer/guide/grid'
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

    ActionTool:               'tool/action_tool'
    InspectTool:              'tool/inspect_tool'
    SelectTool:               'tool/select_tool'
    BoxSelectTool:            'tool/actions/box_select_tool'
    BoxZoomTool:              'tool/actions/box_zoom_tool'
    ObjectExplorerTool:       'tool/actions/object_explorer_tool'
    PanTool:                  'tool/actions/pan_tool'
    PreviewSaveTool:          'tool/actions/preview_save_tool'
    ResetTool:                'tool/actions/reset_tool'
    ResizeTool:               'tool/actions/resize_tool'
    TapTool:                  'tool/actions/tap_tool'
    WheelZoomTool:            'tool/actions/wheel_zoom_tool'
    CrosshairTool:            'tool/inspectors/crosshair_tool'
    HoverTool:                'tool/inspectors/hover_tool'

    DataTable:                'widget/data_table'
    HandsonTable:             'widget/handson_table'
    TableColumn:              'widget/table_column'
    PivotTable:               'widget/pivot_table'
    ObjectExplorer:           'widget/object_explorer'

    Paragraph:                'widget/paragraph'
    HBox:                     'widget/hbox'
    VBox:                     'widget/vbox'
    VBoxForm:                 'widget/vboxform'
    TextInput:                'widget/textinput'
    PreText:                  'widget/pretext'
    Select:                   'widget/selectbox'
    Slider:                   'widget/slider'
    CrossFilter:              'widget/crossfilter'
    MultiSelect:              'widget/multiselect'
    DateRangeSlider:          'widget/date_range_slider'
    DatePicker:               'widget/date_picker'
    Panel:                    'widget/panel'
    Tabs:                     'widget/tabs'
    Dialog:                   'widget/dialog'
    Icon:                     'widget/icon'
    Button:                   'widget/button'
    Toggle:                   'widget/toggle'
    Dropdown:                 'widget/dropdown'
    CheckboxGroup:            'widget/checkbox_group'
    RadioGroup:               'widget/radio_group'
    CheckboxButtonGroup:      'widget/checkbox_button_group'
    RadioButtonGroup:         'widget/radio_button_group'

    AutoEncode:               'transforms/autoencode'
    BinarySegment:            'transforms/binarysegment'
    Const:                    'transforms/const'
    Contour:                  'transforms/contour'
    Count:                    'transforms/count'
    CountCategories:          'transforms/countcategories'
    Cuberoot:                 'transforms/cuberoot'
    HDAlpha:                  'transforms/hdalpha'
    Encode:                   'transforms/encode'
    Id:                       'transforms/id'
    Interpolate:              'transforms/interpolate'
    InterpolateColor:         'transforms/interpolatecolor'
    Log:                      'transforms/log'
    NonZero:                  'transforms/nonzero'
    Ratio:                    'transforms/ratio'
    Seq:                      'transforms/seq'
    Spread:                   'transforms/spread'
    ToCounts:                 'transforms/tocounts'

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
