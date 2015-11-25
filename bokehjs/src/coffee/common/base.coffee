_ = require "underscore"
Collection = require "./collection"
window = {location: {href: "local"}} unless window?

coffee = require "coffee-script"

{logger} = require "./logging"

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
  Canvas:                   require './canvas'
  LayoutBox:                require './layout_box'
  CartesianFrame:           require './cartesian_frame'
  SelectionManager:         require './selection_manager'
  Selector:                 require './selector'
  ToolEvents:               require './tool_events'

  CustomJS:                 require '../callback/customjs'
  OpenURL:                  require '../callback/open_url'

  CategoricalMapper:        require '../mapper/categorical_mapper'
  LinearColorMapper:        require '../mapper/linear_color_mapper'
  LinearMapper:             require '../mapper/linear_mapper'
  LogMapper:                require '../mapper/log_mapper'

  DataRange1d:              require '../range/data_range1d'
  FactorRange:              require '../range/factor_range'
  Range1d:                  require '../range/range1d'

  BoxAnnotation:            require '../renderer/annotation/box_annotation'
  Legend:                   require '../renderer/annotation/legend'
  Span:                     require '../renderer/annotation/span'
  Tooltip:                  require '../renderer/annotation/tooltip'

  TileRenderer:             require '../renderer/tile/tile_renderer'
  TileSource:               require '../renderer/tile/tile_source'
  TMSTileSource:            require '../renderer/tile/tms_tile_source'
  WMTSTileSource:           require '../renderer/tile/wmts_tile_source'
  QUADKEYTileSource:        require '../renderer/tile/quadkey_tile_source'
  BBoxTileSource:           require '../renderer/tile/bbox_tile_source'

  DynamicImageRenderer:     require '../renderer/tile/dynamic_image_renderer'
  ImageSource:              require '../renderer/tile/image_source'

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
  BlazeDataSource:          require '../source/blaze_data_source'
  AjaxDataSource:           require '../source/ajax_data_source'

  AbstractTicker:           require '../ticking/abstract_ticker'
  AdaptiveTicker:           require '../ticking/adaptive_ticker'
  BasicTicker:              require '../ticking/basic_ticker'
  CategoricalTicker:        require '../ticking/categorical_ticker'
  CompositeTicker:          require '../ticking/composite_ticker'
  DatetimeTicker:           require '../ticking/datetime_ticker'
  DaysTicker:               require '../ticking/days_ticker'
  FixedTicker:              require '../ticking/fixed_ticker'
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

_mod_cache = null # XXX: do NOT access directly outside _get_mod_cache()

_get_mod_cache = () ->
  if not _mod_cache?
    _mod_cache = make_cache(locations)
  _mod_cache

Collections = (typename) ->
  mod_cache = _get_mod_cache()

  if collection_overrides[typename]
    return collection_overrides[typename]

  mod = mod_cache[typename]

  if not mod?
    throw new Error("Module `#{typename}' does not exists. The problem may be two fold. Either
                     a model was requested that's available in an extra bundle, e.g. a widget,
                     or a custom model was requested, but it wasn't registered before first
                     usage.")

  if not mod.Collection?
    mod.Collection = make_collection(mod.Model)

  return mod.Collection

Collections.register = (name, collection) ->
  collection_overrides[name] = collection

# XXX: this refers to the 4th and 5th arguments of the outer function of this module,
# which is provided by browserify during # compilation. Only first three arguments
# are named, i.e require, module and exports, so the next ones we have to retrieve
# like this. `modules` is the set of all modules known to bokehjs upon compilation
# and # extended with module registration mechanism. `cache` is an internal thing of
# browserify, but we have to manage it here as well, to all module re-registration.
browserify = {
  modules: arguments[4]
  cache: arguments[5]
}

Collections.register_plugin = (plugin, locations) ->
  logger.info("Registering plugin: #{plugin}")
  Collections.register_locations locations, errorFn = (name) ->
    throw new Error("#{name} was already registered, attempted to re-register in #{plugin}")

Collections.register_locations = (locations, force=false, errorFn=null) ->
  mod_cache = _get_mod_cache()
  cache = make_cache(locations)

  for own name, module of cache
    if force or not mod_cache.hasOwnProperty(name)
      mod_cache[name] = module
    else
      errorFn?(name)

Collections.register_model = (name, mod) ->
  logger.info("Registering model: #{name}")

  compile = (code) ->
    body = coffee.compile(code, {bare: true, shiftLine: true})
    new Function("require", "module", "exports", body)

  mod_cache = _get_mod_cache()

  mod_name = "custom/#{name.toLowerCase()}"
  [impl, deps] = mod
  delete browserify.cache[mod_name]
  browserify.modules[mod_name] = [compile(impl), deps]
  _locations = {}
  _locations[name] = require(mod_name)
  Collections.register_locations(_locations, force=true)

Collections.register_models = (specs) ->
  for own name, impl of specs
    Collections.register_model(name, impl)

# "index" is a map from the toplevel model IDs rendered by
# embed.coffee, to the view objects for those models.  It doesn't
# contain all views, only those explicitly rendered to an element
# by embed.coffee.
index = {}

module.exports =
  collection_overrides: collection_overrides # for testing only
  locations: locations #
  index: index
  Collections: Collections
  Config: Config
