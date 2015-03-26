_ = require "underscore"

# add some useful functions to underscore
require("./custom").monkey_patch()

Config = {}
url = window.location.href
if url.indexOf('/bokeh') > 0
  Config.prefix = url.slice(0, url.lastIndexOf('/bokeh')) + "/" #keep trailing slash
else
  Config.prefix = '/'
console.log('Bokeh: setting prefix to', Config.prefix)

locations =
  OpenURL:                  'action/open_url'

  Plot:                     './plot'
  GMapPlot:                 './gmap_plot'
  GeoJSPlot:                './geojs_plot'
  GridPlot:                 './grid_plot'
  PlotContext:              './plot_context'
  PlotList:                 './plot_context'
  Canvas:                   './canvas'
  LayoutBox:                './layout_box'
  CartesianFrame:           './cartesian_frame'
  SelectionManager:         './selection_manager'
  Selector:                 './selector'
  ToolEvents:               './tool_events'

  LinearColorMapper:        '../mapper/linear_color_mapper'

  DataRange1d:              '../range/data_range1d'
  FactorRange:              '../range/factor_range'
  Range1d:                  '../range/range1d'

  Legend:                   '../renderer/annotation/legend'
  Span:                     '../renderer/annotation/span'
  Tooltip:                  '../renderer/annotation/tooltip'

  GlyphRenderer:            '../renderer/glyph/glyph_renderer'

  AnnularWedge:             '../renderer/glyph/annular_wedge'
  Annulus:                  '../renderer/glyph/annulus'
  Arc:                      '../renderer/glyph/arc'
  Bezier:                   '../renderer/glyph/bezier'
  Circle:                   '../renderer/glyph/circle'
  Gear:                     '../renderer/glyph/gear'
  Image:                    '../renderer/glyph/image'
  ImageRGBA:                '../renderer/glyph/image_rgba'
  ImageURL:                 '../renderer/glyph/image_url'
  Line:                     '../renderer/glyph/line'
  MultiLine:                '../renderer/glyph/multi_line'
  Oval:                     '../renderer/glyph/oval'
  Patch:                    '../renderer/glyph/patch'
  Patches:                  '../renderer/glyph/patches'
  Quad:                     '../renderer/glyph/quad'
  Quadratic:                '../renderer/glyph/quadratic'
  Ray:                      '../renderer/glyph/ray'
  Rect:                     '../renderer/glyph/rect'
  Segment:                  '../renderer/glyph/segment'
  Text:                     '../renderer/glyph/text'
  Wedge:                    '../renderer/glyph/wedge'

  Asterisk:                 '../renderer/glyph/marker/asterisk'
  CircleCross:              '../renderer/glyph/marker/circle_cross'
  CircleX:                  '../renderer/glyph/marker/circle_x'
  Cross:                    '../renderer/glyph/marker/cross'
  Diamond:                  '../renderer/glyph/marker/diamond'
  DiamondCross:             '../renderer/glyph/marker/diamond_cross'
  InvertedTriangle:         '../renderer/glyph/marker/inverted_triangle'
  Square:                   '../renderer/glyph/marker/square'
  SquareCross:              '../renderer/glyph/marker/square_cross'
  SquareX:                  '../renderer/glyph/marker/square_x'
  Triangle:                 '../renderer/glyph/marker/triangle'
  X:                        '../renderer/glyph/marker/x'

  LinearAxis:               '../renderer/guide/linear_axis'
  LogAxis:                  '../renderer/guide/log_axis'
  CategoricalAxis:          '../renderer/guide/categorical_axis'
  DatetimeAxis:             '../renderer/guide/datetime_axis'
  Grid:                     '../renderer/guide/grid'

  BoxSelection:             '../renderer/overlay/box_selection'
  PolySelection:            '../renderer/overlay/poly_selection'

  ColumnDataSource:         '../source/column_data_source'
  ServerDataSource:         '../source/server_data_source'
  BlazeDataSource:          '../source/blaze_data_source'
  AjaxDataSource:           '../source/ajax_data_source'

  AbstractTicker:           '../ticking/abstract_ticker'
  AdaptiveTicker:           '../ticking/adaptive_ticker'
  BasicTicker:              '../ticking/basic_ticker'
  CategoricalTicker:        '../ticking/categorical_ticker'
  CompositeTicker:          '../ticking/composite_ticker'
  DatetimeTicker:           '../ticking/datetime_ticker'
  DaysTicker:               '../ticking/days_ticker'
  LogTicker:                '../ticking/log_ticker'
  MonthsTicker:             '../ticking/months_ticker'
  SingleIntervalTicker:     '../ticking/single_interval_ticker'
  YearsTicker:              '../ticking/years_ticker'

  BasicTickFormatter:       '../ticking/basic_tick_formatter'
  LogTickFormatter:         '../ticking/log_tick_formatter'
  CategoricalTickFormatter: '../ticking/categorical_tick_formatter'
  DatetimeTickFormatter:    '../ticking/datetime_tick_formatter'
  NumeralTickFormatter:     '../ticking/numeral_tick_formatter'
  PrintfTickFormatter:      '../ticking/printf_tick_formatter'

  ButtonTool:               '../tool/button_tool'
  ActionTool:               '../tool/actions/action_tool'
  PreviewSaveTool:          '../tool/actions/preview_save_tool'
  ResetTool:                '../tool/actions/reset_tool'

  BoxSelectTool:            '../tool/gestures/box_select_tool'
  BoxZoomTool:              '../tool/gestures/box_zoom_tool'
  GestureTool:              '../tool/gestures/gesture_tool'
  LassoSelectTool:          '../tool/gestures/lasso_select_tool'
  PanTool:                  '../tool/gestures/pan_tool'
  PolySelectTool:           '../tool/gestures/poly_select_tool'
  SelectTool:               '../tool/gestures/select_tool'
  ResizeTool:               '../tool/gestures/resize_tool'
  TapTool:                  '../tool/gestures/tap_tool'
  WheelZoomTool:            '../tool/gestures/wheel_zoom_tool'

  CrosshairTool:            '../tool/inspectors/crosshair_tool'
  HoverTool:                '../tool/inspectors/hover_tool'
  InspectTool:              '../tool/inspectors/inspect_tool'

  StringFormatter:          ['../widget/cell_formatters', 'String']
  NumberFormatter:          ['../widget/cell_formatters', 'Number']
  BooleanFormatter:         ['../widget/cell_formatters', 'Boolean']
  DateFormatter:            ['../widget/cell_formatters', 'Date']

  StringEditor:             ['../widget/cell_editors', 'String']
  TextEditor:               ['../widget/cell_editors', 'Text']
  SelectEditor:             ['../widget/cell_editors', 'Select']
  PercentEditor:            ['../widget/cell_editors', 'Percent']
  CheckboxEditor:           ['../widget/cell_editors', 'Checkbox']
  IntEditor:                ['../widget/cell_editors', 'Int']
  NumberEditor:             ['../widget/cell_editors', 'Number']
  TimeEditor:               ['../widget/cell_editors', 'Time']
  DateEditor:               ['../widget/cell_editors', 'Date']

  TableColumn:              '../widget/table_column'
  DataTable:                '../widget/data_table'
  Paragraph:                '../widget/paragraph'
  HBox:                     '../widget/hbox'
  VBox:                     '../widget/vbox'
  VBoxForm:                 '../widget/vboxform'
  TextInput:                '../widget/text_input'
  AutocompleteInput:        '../widget/autocomplete_input'
  PreText:                  '../widget/pretext'
  Select:                   '../widget/selectbox'
  Slider:                   '../widget/slider'
  CrossFilter:              '../widget/crossfilter'
  MultiSelect:              '../widget/multiselect'
  DateRangeSlider:          '../widget/date_range_slider'
  DatePicker:               '../widget/date_picker'
  Panel:                    '../widget/panel'
  Tabs:                     '../widget/tabs'
  Dialog:                   '../widget/dialog'
  Icon:                     '../widget/icon'
  Button:                   '../widget/button'
  Toggle:                   '../widget/toggle'
  Dropdown:                 '../widget/dropdown'
  CheckboxGroup:            '../widget/checkbox_group'
  RadioGroup:               '../widget/radio_group'
  CheckboxButtonGroup:      '../widget/checkbox_button_group'
  RadioButtonGroup:         '../widget/radio_button_group'
  SimpleApp:                '../widget/simpleapp'

  AppHBox:                  '../widget/layouts/apphbox'
  AppVBox:                  '../widget/layouts/appvbox'
  AppVBoxForm:              '../widget/layouts/appvboxform'

  AutoEncode:               '../transforms/autoencode'
  BinarySegment:            '../transforms/binarysegment'
  Const:                    '../transforms/const'
  Contour:                  '../transforms/contour'
  Count:                    '../transforms/count'
  CountCategories:          '../transforms/countcategories'
  Cuberoot:                 '../transforms/cuberoot'
  HDAlpha:                  '../transforms/hdalpha'
  Encode:                   '../transforms/encode'
  Id:                       '../transforms/id'
  Interpolate:              '../transforms/interpolate'
  InterpolateColor:         '../transforms/interpolatecolor'
  Log:                      '../transforms/log'
  NonZero:                  '../transforms/nonzero'
  Ratio:                    '../transforms/ratio'
  Seq:                      '../transforms/seq'
  Spread:                   '../transforms/spread'
  ToCounts:                 '../transforms/tocounts'

mod_cache = {}
collection_overrides = {}

Collections = (typename) ->
  if collection_overrides[typename]
    return collection_overrides[typename]

  if not locations[typename]
    throw new Error("./base: Unknown Collection #{typename}")

  modulename = locations[typename]

  if _.isArray(modulename)
    [modulename, submodulename] = modulename
  else
    submodulename = null

  if not mod_cache[modulename]?
    mod = reqire "./#{modulename}"

    if mod?
      mod_cache[modulename] = mod
    else
      throw new Error("improperly implemented collection: #{modulename}")

  mod = mod_cache[modulename]

  if submodulename?
    mod = mod[submodulename]

  return mod.Collection

Collections.register = (name, collection) ->
  collection_overrides[name] = collection

index = {}

module.exports =
  collection_overrides: collection_overrides # for testing only
  mod_cache: mod_cache # for testing only
  locations: locations
  index: index
  Collections: Collections
  Config: Config
