_ = require "underscore"
Backbone = require "backbone"

HasProps = require "./has_props"
{Angle, Array, Bool, Color, Coord, Direction, Distance, Enum, FontStyle, LineCap, LineJoin, Number, String, TextAlign, TextBaseline} = require "./properties"

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

  Line: Line
  Fill: Fill
  Text: Text

  factories:
    coords: coords
    distances: distances
    angles: angles
    fields: fields
    visuals: visuals

