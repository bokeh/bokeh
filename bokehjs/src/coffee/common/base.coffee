_ = require "underscore"
Collection = require "./collection"
window = {location: {href: "local"}} unless window?

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
  Plot:                     require './plot'
  GMapPlot:                 require './gmap_plot'
  GeoJSPlot:                require './geojs_plot'
  GridPlot:                 require './grid_plot'
  PlotContext:              require './plot_context'
  PlotList:                 require './plot_context'
  Canvas:                   require './canvas'
  LayoutBox:                require './layout_box'
  CartesianFrame:           require './cartesian_frame'
  SelectionManager:         require './selection_manager'
  Selector:                 require './selector'
  ToolEvents:               require './tool_events'

  Callback:                 require '../action/callback'
  OpenURL:                  require '../action/open_url'

  CategoricalMapper:        require '../mapper/categorical_mapper'
  LinearColorMapper:        require '../mapper/linear_color_mapper'
  LinearMapper:             require '../mapper/linear_mapper'

  DataRange1d:              require '../range/data_range1d'
  FactorRange:              require '../range/factor_range'
  Range1d:                  require '../range/range1d'

  Legend:                   require '../renderer/annotation/legend'
  Span:                     require '../renderer/annotation/span'
  Tooltip:                  require '../renderer/annotation/tooltip'

  GlyphRenderer:            require '../renderer/glyph/glyph_renderer'

  AnnularWedge:             require '../renderer/glyph/annular_wedge'
  Annulus:                  require '../renderer/glyph/annulus'
  Arc:                      require '../renderer/glyph/arc'
  Bezier:                   require '../renderer/glyph/bezier'
  Circle:                   require '../renderer/glyph/circle'
  Gear:                     require '../renderer/glyph/gear'
  Image:                    require '../renderer/glyph/image'
  ImageRGBA:                require '../renderer/glyph/image_rgba'
  ImageURL:                 require '../renderer/glyph/image_url'
  Line:                     require '../renderer/glyph/line'
  MultiLine:                require '../renderer/glyph/multi_line'
  Oval:                     require '../renderer/glyph/oval'
  Patch:                    require '../renderer/glyph/patch'
  Patches:                  require '../renderer/glyph/patches'
  Quad:                     require '../renderer/glyph/quad'
  Quadratic:                require '../renderer/glyph/quadratic'
  Ray:                      require '../renderer/glyph/ray'
  Rect:                     require '../renderer/glyph/rect'
  Segment:                  require '../renderer/glyph/segment'
  Text:                     require '../renderer/glyph/text'
  Wedge:                    require '../renderer/glyph/wedge'

  Asterisk:                 require '../renderer/glyph/marker/asterisk'
  CircleCross:              require '../renderer/glyph/marker/circle_cross'
  CircleX:                  require '../renderer/glyph/marker/circle_x'
  Cross:                    require '../renderer/glyph/marker/cross'
  Diamond:                  require '../renderer/glyph/marker/diamond'
  DiamondCross:             require '../renderer/glyph/marker/diamond_cross'
  InvertedTriangle:         require '../renderer/glyph/marker/inverted_triangle'
  Square:                   require '../renderer/glyph/marker/square'
  SquareCross:              require '../renderer/glyph/marker/square_cross'
  SquareX:                  require '../renderer/glyph/marker/square_x'
  Triangle:                 require '../renderer/glyph/marker/triangle'
  X:                        require '../renderer/glyph/marker/x'

  LinearAxis:               require '../renderer/guide/linear_axis'
  LogAxis:                  require '../renderer/guide/log_axis'
  CategoricalAxis:          require '../renderer/guide/categorical_axis'
  DatetimeAxis:             require '../renderer/guide/datetime_axis'
  Grid:                     require '../renderer/guide/grid'

  BoxSelection:             require '../renderer/overlay/box_selection'
  PolySelection:            require '../renderer/overlay/poly_selection'

  ColumnDataSource:         require '../source/column_data_source'
  ServerDataSource:         require '../source/server_data_source'
  BlazeDataSource:          require '../source/blaze_data_source'
  AjaxDataSource:           require '../source/ajax_data_source'

  AbstractTicker:           require '../ticking/abstract_ticker'
  AdaptiveTicker:           require '../ticking/adaptive_ticker'
  BasicTicker:              require '../ticking/basic_ticker'
  CategoricalTicker:        require '../ticking/categorical_ticker'
  CompositeTicker:          require '../ticking/composite_ticker'
  DatetimeTicker:           require '../ticking/datetime_ticker'
  DaysTicker:               require '../ticking/days_ticker'
  LogTicker:                require '../ticking/log_ticker'
  MonthsTicker:             require '../ticking/months_ticker'
  SingleIntervalTicker:     require '../ticking/single_interval_ticker'
  YearsTicker:              require '../ticking/years_ticker'

  BasicTickFormatter:       require '../ticking/basic_tick_formatter'
  LogTickFormatter:         require '../ticking/log_tick_formatter'
  CategoricalTickFormatter: require '../ticking/categorical_tick_formatter'
  DatetimeTickFormatter:    require '../ticking/datetime_tick_formatter'
  NumeralTickFormatter:     require '../ticking/numeral_tick_formatter'
  PrintfTickFormatter:      require '../ticking/printf_tick_formatter'

  ButtonTool:               require '../tool/button_tool'
  ActionTool:               require '../tool/actions/action_tool'
  PreviewSaveTool:          require '../tool/actions/preview_save_tool'
  ResetTool:                require '../tool/actions/reset_tool'
  HelpTool:                 require '../tool/actions/help_tool'

  BoxSelectTool:            require '../tool/gestures/box_select_tool'
  BoxZoomTool:              require '../tool/gestures/box_zoom_tool'
  GestureTool:              require '../tool/gestures/gesture_tool'
  LassoSelectTool:          require '../tool/gestures/lasso_select_tool'
  PanTool:                  require '../tool/gestures/pan_tool'
  PolySelectTool:           require '../tool/gestures/poly_select_tool'
  SelectTool:               require '../tool/gestures/select_tool'
  ResizeTool:               require '../tool/gestures/resize_tool'
  TapTool:                  require '../tool/gestures/tap_tool'
  WheelZoomTool:            require '../tool/gestures/wheel_zoom_tool'

  CrosshairTool:            require '../tool/inspectors/crosshair_tool'
  HoverTool:                require '../tool/inspectors/hover_tool'
  InspectTool:              require '../tool/inspectors/inspect_tool'

  editors:                  [require('../widget/cell_editors'), "Editor"]
  formatters:               [require('../widget/cell_formatters'), "Formatter"]

  TableColumn:              require '../widget/table_column'
  DataTable:                require '../widget/data_table'
  Paragraph:                require '../widget/paragraph'
  HBox:                     require '../widget/hbox'
  VBox:                     require '../widget/vbox'
  VBoxForm:                 require '../widget/vboxform'
  TextInput:                require '../widget/text_input'
  AutocompleteInput:        require '../widget/autocomplete_input'
  PreText:                  require '../widget/pretext'
  Select:                   require '../widget/selectbox'
  Slider:                   require '../widget/slider'
  CrossFilter:              require '../widget/crossfilter'
  MultiSelect:              require '../widget/multiselect'
  DateRangeSlider:          require '../widget/date_range_slider'
  DatePicker:               require '../widget/date_picker'
  Panel:                    require '../widget/panel'
  Tabs:                     require '../widget/tabs'
  Dialog:                   require '../widget/dialog'
  Icon:                     require '../widget/icon'
  Button:                   require '../widget/button'
  Toggle:                   require '../widget/toggle'
  Dropdown:                 require '../widget/dropdown'
  CheckboxGroup:            require '../widget/checkbox_group'
  RadioGroup:               require '../widget/radio_group'
  CheckboxButtonGroup:      require '../widget/checkbox_button_group'
  RadioButtonGroup:         require '../widget/radio_button_group'
  SimpleApp:                require '../widget/simpleapp'

  AppHBox:                  require '../widget/layouts/apphbox'
  AppVBox:                  require '../widget/layouts/appvbox'
  AppVBoxForm:              require '../widget/layouts/appvboxform'

  ar_transforms:            [require '../ar/transforms']

collection_overrides = {}


make_collection = (model) ->
  class C extends Collection
    model: model
  return new C()

make_cache = (locations) ->
  result = {}
  for name, spec of locations
    if _.isArray(spec)
      subspec = spec[0]
      suffix = spec[1] ? ""
      for subname, mod of subspec
        modname = subname + suffix
        result[modname] = mod
    else
      result[name] = spec
  return result

_mod_cache = null

Collections = (typename) ->
  if not _mod_cache?
    _mod_cache = make_cache(locations)

  if collection_overrides[typename]
    return collection_overrides[typename]

  mod = _mod_cache[typename]

  if not mod.Collection?
    mod.Collection = make_collection(mod.Model)

  return mod.Collection

Collections.register = (name, collection) ->
  collection_overrides[name] = collection

index = {}

module.exports =
  collection_overrides: collection_overrides # for testing only
  locations: locations #
  index: index
  Collections: Collections
  Config: Config
