_ = require "underscore"
HasProperties = require "./has_properties"
svg_colors = require "./svg_colors"

class Property extends HasProperties

  initialize: (attrs, options) ->
    super(attrs, options)
    obj = @get('obj')
    attr = @get('attr')

    attr_value = obj.get(attr)

    if _.isObject(attr_value) and not _.isArray(attr_value)
      # use whichever the spec provides if there is a spec
      @spec = attr_value
      if @spec.value?
        @fixed_value = @spec.value
      else if @spec.field?
        @field = @spec.field
      else
        throw new Error("spec for property '#{attr}' needs one of 'value' or 'field'")
    else
      # otherwise if there is no spec use a default
      @fixed_value = attr_value

    if @field? and not _.isString(@field)
      throw new Error("field value for property '#{attr}' is not a string")

    if @fixed_value?
      @validate(@fixed_value, attr)

  value: () ->
    result = if @fixed_value? then @fixed_value else NaN
    return @transform([result])[0]

  array: (source) ->
    data = source.get('data')
    if @field? and (@field of data)
      return @transform(source.get_column(@field))
    else
      length = source.get_length()
      length = 1 if not length?
      value = @value() # already transformed
      return (value for i in [0...length])

  transform: (values) -> values

  validate: (value, attr) -> true

#
# Numeric Properties
#

class Numeric extends Property

  validate: (value, attr) ->
    if not _.isNumber(value)
      throw new Error("numeric property '#{attr}' given invalid value: #{value}")
    return true

  transform: (values) ->
    result = new Float64Array(values.length)
    for i in [0...values.length]
      result[i] = values[i]
    return result

class Angle extends Numeric

  initialize: (attrs, options) ->
    super(attrs, options)
    obj = @get('obj')
    attr = @get('attr')
    @units = @spec?.units ? obj.get("#{attr}_units") ? "rad"
    if @units != "deg" and @units != "rad"
      throw new Error("Angle units must be one of 'deg' or 'rad', given invalid value: #{@units}")

  transform: (values) ->
    if @units == "deg"
      values = (x * Math.PI/180.0 for x in values)
    values = (-x for x in values)
    return super(values)

class Distance extends Numeric

  initialize: (attrs, options) ->
    super(attrs, options)
    obj = @get('obj')
    attr = @get('attr')
    @units = @spec?.units ? obj.get("#{attr}_units") ? "data"
    if @units != "data" and @units != "screen"
      throw new Error("Distance units must be one of 'data' or 'screen', given invalid value: #{@units}")


#
# Basic Properties
#

class Array extends Property

  validate: (value, attr) ->
    if not _.isArray(value)
      throw new Error("array property '#{attr}' given invalid value: #{value}")
    return true

class Bool extends Property

  validate: (value, attr) ->
    if not _.isBoolean(value)
      throw new Error("boolean property '#{attr}' given invalid value: #{value}")
    return true

class Coord extends Property

  validate: (value, attr) ->
    if not _.isNumber(value) and not _.isString(value)
      throw new Error("coordinate property '#{attr}' given invalid value: #{value}")
    return true

class Color extends Property

  validate: (value, attr) ->
    if not svg_colors[value]? and value.substring(0, 1) != "#" and not @valid_rgb(value)
      throw new Error("color property '#{attr}' given invalid value: #{value}")
    return true

  valid_rgb: (value) ->
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

class String extends Property

  validate: (value, attr) ->
    if not _.isString(value)
      throw new Error("string property '#{attr}' given invalid value: #{value}")
    return true

class Enum extends Property

  initialize: (attrs, options) ->
    @levels = attrs.values.split(" ")
    super(attrs, options)

  validate: (value, attr) ->
    if value not in @levels
      throw new Error("enum property '#{attr}' given invalid value: #{value},
                       valid values are: #{@levels}")
    return true

class Direction extends Enum

  initialize: (attrs, options) ->
    attrs.values = "anticlock clock"
    super(attrs, options)

  transform: (values) ->
    result = new Uint8Array(values.length)
    for i in [0...values.length]
      switch values[i]
        when 'clock'     then result[i] = false
        when 'anticlock' then result[i] = true
    return result


#
# Drawing Context Properties
#

class ContextProperties extends HasProperties

  initialize: (attrs, options) ->
    @cache = {}
    super(attrs, options)

  warm_cache: (source, attrs) ->
    for attr in attrs
      prop = @[attr]
      if prop.fixed_value?
        @cache[attr] = prop.fixed_value
      else
        @cache[attr+"_array"] = prop.array(source)

  cache_select: (attr, i) ->
    prop = @[attr]
    if prop.fixed_value?
      @cache[attr] = prop.fixed_value
    else
      @cache[attr] = @cache[attr+"_array"][i]

class Line extends ContextProperties

  initialize: (attrs, options) ->
    super(attrs, options)

    obj = @get('obj')
    prefix = @get('prefix')

    @color = new Color({obj: obj, attr: "#{prefix}line_color"})
    @width = new Numeric({obj: obj, attr: "#{prefix}line_width"})
    @alpha = new Numeric({obj: obj, attr: "#{prefix}line_alpha"})
    @join = new Enum
      obj: obj
      attr: "#{prefix}line_join"
      values: "miter round bevel"
    @cap = new Enum
      obj: obj
      attr: "#{prefix}line_cap"
      values: "butt round square"
    @dash = new Array({obj: obj, attr: "#{prefix}line_dash"})
    @dash_offset = new Numeric({obj: obj, attr: "#{prefix}line_dash_offset"})

    @do_stroke = true
    if not _.isUndefined(@color.fixed_value)
      if _.isNull(@color.fixed_value)
        @do_stroke = false

  warm_cache: (source) ->
    super(source,
          ["color", "width", "alpha", "join", "cap", "dash", "dash_offset"])

  set_value: (ctx) ->
    ctx.strokeStyle = @color.value()
    ctx.globalAlpha = @alpha.value()
    ctx.lineWidth   = @width.value()
    ctx.lineCap     = @join.value()
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
    @alpha = new Numeric({obj: obj, attr: "#{prefix}fill_alpha"})

    @do_fill = true
    if not _.isUndefined(@color.fixed_value)
      if _.isNull(@color.fixed_value)
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
    @font_style = new Enum
      obj: obj
      attr: "#{prefix}text_font_style"
      values: "normal italic bold"
    @color = new Color({obj: obj, attr: "#{prefix}text_color"})
    @alpha = new Numeric({obj: obj, attr: "#{prefix}text_alpha"})
    @align = new Enum
      obj: obj
      attr: "#{prefix}text_align", values: "left right center"
    @baseline = new Enum
      obj: obj
      attr: "#{prefix}text_baseline"
      values: "top middle bottom alphabetic hanging"

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
      when "enum"
        result[field] = new Enum({obj: model, attr: field, values:arg})
      when "number" then result[field] = new Numeric({obj: model, attr: field})
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
  Angle: Angle
  Array: Array
  Bool: Bool
  Color: Color
  Coord: Coord
  Direction: Direction
  Distance: Distance
  Enum: Enum
  Numeric: Numeric
  Property: Property
  String: String

  Line: Line
  Fill: Fill
  Text: Text

  factories:
    coords: coords
    distances: distances
    angles: angles
    fields: fields
    visuals: visuals
