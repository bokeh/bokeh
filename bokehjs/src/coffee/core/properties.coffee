_ = require "underscore"
Backbone = require "backbone"

enums = require "./enums"
HasProps = require "./has_props"
svg_colors = require "./util/svg_colors"

#
# Property base class
#

class Property extends Backbone.Model

  specifiers: ['field', 'value']

  initialize: (attrs, options) ->
    super(attrs, options)

    @_init(false)

    obj = @get('obj')
    attr = @get('attr')
    @listenTo(obj, "change:#{attr}", () -> @_init())
    @listenTo(@, "change:obj", () ->
      throw new Error("attempted to reset 'obj' on Property")
    )
    @listenTo(@, "change:attr", () ->
      throw new Error("attempted to reset 'attr' on Property")
    )

  # ----- customizable policies

  init: () ->

  transform: (values) -> values

  validate: (value) ->

  # ----- property accessors

  value: () ->
    if _.isUndefined(@spec.value)
      return NaN
      # TODO (bev) enable this later
      # throw new Error("attempted to retrieve property value for property without value specification")
    return @transform([@spec.value])[0]

  array: (source) ->
    data = source.get('data')
    if @spec.field? and (@spec.field of data)
      return @transform(source.get_column(@spec.field))
    else
      length = source.get_length()
      length = 1 if not length?
      value = @value() # already transformed
      return (value for i in [0...length])

  # array: (source) ->
  #   if @spec.value?
  #     value = @transform([@spec.value])[0]
  #     return (i) -> value

  #   data = source.get('data')
  #   field = @spec.field
  #   if field of data
  #     transformed = @transform(source.get_column(field))
  #     return (i) -> transformed[i]
  #   throw new Error("field '#{field}' does not exist on source")

  # ----- private methods

  _init: (trigger=true) ->
    obj = @get('obj')
    if not obj?
      throw new Error("missing property object")
    if obj not instanceof HasProps
      throw new Error("property object must be a HasProps")

    attr = @get('attr')
    if not attr?
      throw new Error("missing property attr")

    attr_value = obj.get(attr)

    # TODO (bev) add this in later when some other code is ready for it
    # if _.isUndefined(attr_value)
    #   if _.isUndefined(@get('default_value'))
    #     throw new Error("attr '#{attr}' does not exist on property object and no default supplied")
    #   obj.set(attr, @get('default_value'), {silent: true})

    if _.isObject(attr_value) and not _.isArray(attr_value)
      @spec = attr_value
      if _.size(_.pick.apply(null, [@spec].concat(@specifiers))) != 1
        throw new Error("Invalid property specifier #{JSON.stringify(@spec)}, must have exactly one of #{@specifiers}")

    else
      @spec = {value: attr_value}

    if @spec.field? and not _.isString(@spec.field)
      throw new Error("field value for property '#{attr}' is not a string")

    if @spec.value?
      @validate(@spec.value)

    @init()

    if trigger
      @trigger("change")

#
# Helper functions
#

_valid_rgb = (value) ->
  switch value.substring(0, 4)
      when "rgba" then params = {start: "rgba(", len: 4, alpha: true}
      when "rgb(" then params = {start: "rgb(", len: 3, alpha: false}
      else return false

  # if '.' and then ',' found, we know decimals are used on rgb
  if new RegExp(".*?(\\.).*(,)").test(value)
    throw new Error("color expects integers for rgb in rgb/rgba tuple, received #{value}")

  # extract the numerical values from inside parens
  contents = value.replace(params.start, "").replace(")", "").split(',').map(parseFloat)

  # check length of array based on rgb/rgba
  if contents.length != params.len
    throw new Error("color expects rgba #{expect_len}-tuple, received #{value}")

  # check for valid numerical values for rgba
  if params.alpha and !(0 <= contents[3] <= 1)
    throw new Error("color expects rgba 4-tuple to have alpha value between 0 and 1")
  if false in (0 <= rgb <= 255 for rgb in contents.slice(0, 3))
    throw new Error("color expects rgb to have value between 0 and 255")
  return true

#
# Simple Properties
#

simple_prop = (name, pred) ->
  class Prop extends Property
    toString: () -> "#{name}(obj: #{@get(obj).id}, spec: #{JSON.stringify(@spec)})"
    validate: (value) ->
      if not pred(value)
        attr = @get('attr')
        throw new Error("#{name} property '#{attr}' given invalid value: #{value}")

class Array extends simple_prop("Array", (x) -> _.isArray(x) or x instanceof Float64Array)

class Bool extends simple_prop("Bool", _.isBoolean)

class Color extends simple_prop("Color", (x) ->
  svg_colors[x.toLowerCase()]? or x.substring(0, 1) == "#" or _valid_rgb(x)
)

class Coord extends simple_prop("Coord", (x) -> _.isNumber(x) or _.isString(x))

class Number extends simple_prop("Number", _.isNumber)

class String extends simple_prop("String", _.isString)

#
# Enum properties
#

enum_prop = (name, enum_values) ->
  class Enum extends simple_prop(name, (x) -> x in enum_values)
    toString: () -> "#{name}(obj: #{@get(obj).id}, spec: #{JSON.stringify(@spec)})"

class Direction extends enum_prop("Direction", enums.Direction)
  transform: (values) ->
    result = new Uint8Array(values.length)
    for i in [0...values.length]
      switch values[i]
        when 'clock'     then result[i] = false
        when 'anticlock' then result[i] = true
    return result

class FontStyle extends enum_prop("FontStyle", enums.FontStyle)

class LineCap extends enum_prop("LineCap", enums.LineCap)

class LineJoin extends enum_prop("LineJoin", enums.LineJoin)

class TextAlign extends enum_prop("TextAlign", enums.TextAlign)

class TextBaseline extends enum_prop("TextBaseline", enums.TextBaseline)

#
# Units Properties
#

units_prop = (name, valid_units, default_units) ->
  class UnitsProp extends Number
    toString: () -> "#{name}(obj: #{@get(obj).id}, spec: #{JSON.stringify(@spec)})"
    init: () ->
      if not @spec.units?
        @spec.units = default_units

      # TODO (bev) remove this later, it's just for temporary compat
      @units = @spec.units

      units = @spec.units
      if units not in valid_units
        throw new Error("#{name} units must be one of #{valid_units}, given invalid value: #{units}")

class Angle extends units_prop("Angle", enums.AngleUnits, "rad")
  transform: (values) ->
    if @spec.units == "deg"
      values = (x * Math.PI/180.0 for x in values)
    values = (-x for x in values)
    return super(values)

class Distance extends units_prop("Distance", enums.SpatialUnits, "data")



#
# Drawing Context Properties
#

class ContextProperties extends HasProps

  initialize: (attrs, options) ->
    @cache = {}
    super(attrs, options)

  warm_cache: (source, attrs) ->
    for attr in attrs
      prop = @[attr]
      if prop.spec.value?
        @cache[attr] = prop.spec.value
      else
        @cache[attr+"_array"] = prop.array(source)

  cache_select: (attr, i) ->
    prop = @[attr]
    if prop.spec.value?
      @cache[attr] = prop.spec.value
    else
      @cache[attr] = @cache[attr+"_array"][i]

class Line extends ContextProperties

  initialize: (attrs, options) ->
    super(attrs, options)

    obj = @get('obj')
    prefix = @get('prefix')

    @color = new Color({obj: obj, attr: "#{prefix}line_color"})
    @width = new Number({obj: obj, attr: "#{prefix}line_width"})
    @alpha = new Number({obj: obj, attr: "#{prefix}line_alpha"})
    @join = new LineJoin({obj: obj, attr: "#{prefix}line_join"})
    @cap = new LineCap({obj: obj, attr: "#{prefix}line_cap"})
    @dash = new Array({obj: obj, attr: "#{prefix}line_dash"})
    @dash_offset = new Number({obj: obj, attr: "#{prefix}line_dash_offset"})

    @do_stroke = true
    if not _.isUndefined(@color.spec.value)
      if _.isNull(@color.spec.value)
        @do_stroke = false

  warm_cache: (source) ->
    super(source,
          ["color", "width", "alpha", "join", "cap", "dash", "dash_offset"])

  set_value: (ctx) ->
    ctx.strokeStyle = @color.value()
    ctx.globalAlpha = @alpha.value()
    ctx.lineWidth   = @width.value()
    ctx.lineJoin    = @join.value()
    ctx.lineCap     = @cap.value()
    ctx.setLineDash(@dash.value())
    ctx.setLineDashOffset(@dash_offset.value())

  set_vectorize: (ctx, i) ->
    @cache_select("color", i)
    if ctx.strokeStyle != @cache.fill
      ctx.strokeStyle = @cache.color

    @cache_select("alpha", i)
    if ctx.globalAlpha != @cache.alpha
      ctx.globalAlpha = @cache.alpha

    @cache_select("width", i)
    if ctx.lineWidth != @cache.width
      ctx.lineWidth = @cache.width

    @cache_select("join", i)
    if ctx.lineJoin != @cache.join
      ctx.lineJoin = @cache.join

    @cache_select("cap", i)
    if ctx.lineCap != @cache.cap
      ctx.lineCap = @cache.cap

    @cache_select("dash", i)
    if ctx.getLineDash() != @cache.dash
      ctx.setLineDash(@cache.dash)

    @cache_select("dash_offset", i)
    if ctx.getLineDashOffset() != @cache.dash_offset
      ctx.setLineDashOffset(@cache.dash_offset)


class Fill extends ContextProperties

  initialize: (attrs, options) ->
    super(attrs, options)

    obj = @get('obj')
    prefix = @get('prefix')

    @color = new Color({obj: obj, attr: "#{prefix}fill_color"})
    @alpha = new Number({obj: obj, attr: "#{prefix}fill_alpha"})

    @do_fill = true
    if not _.isUndefined(@color.spec.value)
      if _.isNull(@color.spec.value)
        @do_fill = false

  warm_cache: (source) ->
    super(source, ["color", "alpha"])

  set_value: (ctx) ->
    ctx.fillStyle   = @color.value()
    ctx.globalAlpha = @alpha.value()

  set_vectorize: (ctx, i) ->
    @cache_select("color", i)
    if ctx.fillStyle != @cache.fill
      ctx.fillStyle = @cache.color

    @cache_select("alpha", i)
    if ctx.globalAlpha != @cache.alpha
      ctx.globalAlpha = @cache.alpha

class Text extends ContextProperties

  initialize: (attrs, options) ->
    super(attrs, options)

    obj = @get('obj')
    prefix = @get('prefix')

    @font = new String({obj: obj, attr: "#{prefix}text_font"})
    @font_size = new String({obj: obj, attr: "#{prefix}text_font_size"})
    @font_style = new FontStyle({obj: obj, attr: "#{prefix}text_font_style"})
    @color = new Color({obj: obj, attr: "#{prefix}text_color"})
    @alpha = new Number({obj: obj, attr: "#{prefix}text_alpha"})
    @align = new TextAlign({obj: obj, attr: "#{prefix}text_align"})
    @baseline = new TextBaseline({obj: obj, attr: "#{prefix}text_baseline"})

  warm_cache: (source) ->
    super(source, ["font", "font_size", "font_style", "color", "alpha", "align", "baseline"])

  cache_select: (name, i) ->
    if name == "font"
      val = super("font_style", i) + " " + super("font_size", i) + " " + super("font", i)
      @cache.font = val
    else
      super(name, i)

  font_value: () ->
    font       = @font.value()
    font_size  = @font_size.value()
    font_style = @font_style.value()
    return font_style + " " + font_size + " " + font

  set_value: (ctx) ->
    ctx.font         = @font_value()
    ctx.fillStyle    = @color.value()
    ctx.globalAlpha  = @alpha.value()
    ctx.textAlign    = @align.value()
    ctx.textBaseline = @baseline.value()

  set_vectorize: (ctx, i) ->
    @cache_select("font", i)
    if ctx.font != @cache.font
      ctx.font = @cache.font

    @cache_select("color", i)
    if ctx.fillStyle != @cache.color
      ctx.fillStyle = @cache.color

    @cache_select("alpha", i)
    if ctx.globalAlpha != @cache.alpha
      ctx.globalAlpha = @cache.alpha

    @cache_select("align", i)
    if ctx.textAlign != @cache.align
      ctx.textAlign = @cache.align

    @cache_select("baseline", i)
    if ctx.textBaseline != @cache.baseline
      ctx.textBaseline = @cache.baseline

#
# convenience factory functions
#

angles = (model, attr="angles") ->
  result = {}
  for angle in model[attr]
    result[angle] = new Angle({obj: model, attr: angle})
  return result

coords = (model, attr="coords") ->
  result = {}
  for [x, y] in model[attr]
    result[x] = new Coord({obj: model, attr: x})
    result[y] = new Coord({obj: model, attr: y})
  return result

distances = (model, attr="distances") ->
  result = {}

  for dist in model[attr]

    if dist[0] == "?"
      dist = dist[1...]
      if not model.get(dist)?
        continue

    result[dist] = new Distance({obj: model, attr: dist})

  return result

fields = (model, attr="fields") ->
  result = {}

  for field in model[attr]
    type = "number"

    if field.indexOf(":") > -1
      [field, type, arg] = field.split(":")

    if field[0] == "?"
      field = field[1...]
      if not model.attributes[field]?
        continue

    switch type
      when "array" then result[field] = new Array({obj: model, attr: field})
      when "bool" then result[field] = new Bool({obj: model, attr: field})
      when "color" then result[field] = new Color({obj: model, attr: field})
      when "direction"
        result[field] = new Direction({obj: model, attr: field})
      when "number" then result[field] = new Number({obj: model, attr: field})
      when "string" then result[field] = new String({obj: model, attr: field})

  return result

visuals = (model, attr="visuals") ->
  result = {}
  for prop in model[attr]
    prefix = ""
    if prop.indexOf(":") > -1
      [prop, prefix] = prop.split(":")
    name = "#{prefix}#{prop}"
    switch prop
      when "line" then result[name] = new Line({obj: model, prefix: prefix})
      when "fill" then result[name] = new Fill({obj: model, prefix: prefix})
      when "text" then result[name] = new Text({obj: model, prefix: prefix})
  return result

module.exports =
  Property: Property

  simple_prop: simple_prop
  enum_prop: enum_prop
  units_prop: units_prop

  Angle: Angle
  Array: Array
  Bool: Bool
  Color: Color
  Coord: Coord
  Direction: Direction
  Distance: Distance
  FontStyle: FontStyle
  LineCap: LineCap
  LineJoin: LineJoin
  Number: Number
  String: String
  TextAlign: TextAlign
  TextBaseline: TextBaseline

  Line: Line
  Fill: Fill
  Text: Text

  factories:
    coords: coords
    distances: distances
    angles: angles
    fields: fields
    visuals: visuals


