

class properties

  setattr: (styleprovider, glyphspec, attrname) ->
    attrtype = "number"
    if attrname.indexOf(":") > -1
      [attrname, attrtype] = attrname.split(":")

    default_value = styleprovider.mget(attrname)
    default_units = styleprovider.mget(attrname).units ? 'data'

    obj = {units: default_units}

    # if the attribute is not on the glyphspec, use the defaults
    if not (attrname of glyphspec)
      if _.isString(default_value)
        if attrtype == "string"
          obj.default = default_value
        else
          obj.field = default_value
      else if _.isNumber(default_value)
        obj.default = default_value
      else if _.isArray(default_value)
        obj.default = default_value
      else if default_value == null
        obj.default = default_value
      else if _.isObject(default_value)
        obj = default_value
        if not obj.units?
          obj.units = default_units
      @[attrname] = obj
      return

    glyph_value = glyphspec[attrname]

    # if the attribute is a string, use the its value as the field or default
    if _.isString(glyph_value)
      if attrtype == "string"
        obj.default = glyph_value
      else
        obj.field = glyph_value

    # if the attribute is a number use its value as the default
    else if _.isNumber(glyph_value)
      obj.default = glyph_value

    # if the attribute is an array use its value as the default
    else if _.isArray(glyph_value)
      obj.default = glyph_value

    # if the attribute is null use its value as the default
    else if glyph_value == null
      obj.default = glyph_value

    # if the attribute is an object, use it as-is, adding defaults and units if needed
    else if _.isObject(glyph_value)
      obj = glyph_value
      if not obj.default?
        obj.default = default_value
      if not obj.units?
        obj.units = default_units

    # otherwise an error
    else
      console.log("Unknown glyph specification value type.")
      return

    @[attrname] = obj

  select: (attrname, obj) ->
    if not (attrname of @)
      return
    if @[attrname].field? and (@[attrname].field of obj)
      return obj[@[attrname].field]
    if obj[attrname]?
      return obj[attrname]
    if @[attrname].default?
      return @[attrname].default


class line_properties extends properties
  constructor: (styleprovider, glyphspec, prefix="") ->
    @line_color_name = "#{ prefix }line_color"
    @line_width_name = "#{ prefix }line_width"
    @line_alpha_name = "#{ prefix }line_alpha"
    @line_join_name  = "#{ prefix }line_join"
    @line_cap_name   = "#{ prefix }line_cap"
    @line_dash_name  = "#{ prefix }line_dash"

    attrnames = [
      @line_color_name + ":string",
      @line_width_name,
      @line_alpha_name,
      @line_join_name + ":string",
      @line_cap_name + ":string",
      @line_dash_name
    ]
    for attrname in attrnames
      @setattr(styleprovider, glyphspec, attrname)
    @do_stroke = not (@line_color.default == null)

  set: (ctx, obj) ->
    ctx.strokeStyle = @select(@line_color_name, obj)
    ctx.globalAlpha = @select(@line_alpha_name, obj)
    ctx.lineWidth   = @select(@line_width_name, obj)
    ctx.lineJoin    = @select(@line_join_name,  obj)
    ctx.lineCap     = @select(@line_cap_name,   obj)
    ctx.setLineDash(@select(@line_dash_name, obj))
    # dash offset/phase unimplemented



class fill_properties extends properties
  constructor: (styleprovider, glyphspec, prefix="") ->
    @fill_name       = "#{ prefix }fill"
    @fill_alpha_name = "#{ prefix }fill_alpha"

    attrnames = [
      @fill_name + ":string",
      @fill_alpha_name
    ]
    for attrname in attrnames
      @setattr(styleprovider, glyphspec, attrname)
    @do_fill = not (@fill.default == null)

  set: (ctx, obj) ->
    ctx.fillStyle   = @select(@fill_name,       obj)
    ctx.globalAlpha = @select(@fill_alpha_name, obj)



class text_properties extends properties
  constructor: (styleprovider, glyphspec, prefix="") ->
    @text_font_name       = "#{ prefix }text_font:string"
    @text_font_size_name  = "#{ prefix }text_font_size:string"
    @text_font_style_name = "#{ prefix }text_font_style:string"
    @text_font_color_name = "#{ prefix }text_font_color:string"
    @text_font_alpha_name = "#{ prefix }text_font_alpha"
    @text_align_name      = "#{ prefix }text_align:string"
    @text_baseline_name   = "#{ prefix }text_baseline:string"
    attrnames = [
      @text_font_name + ":string",
      @text_font_size_name + ":string",
      @text_font_style_name + ":string",
      @text_font_color_name + ":string",
      @text_font_alpha_name,
      @text_align_name + ":string",
      @text_baseline_name + ":string"
    ]
    for attrname in attrnames
      @setattr(styleprovider, glyphspec, attrname)

  set: (ctx, obj) ->
    font       = @select(@text_font_name,       obj)
    font_size  = @select(@text_font_size_name,  obj)
    font_style = @select(@text_font_style_name, obj)

    ctx.font         = font_style + " " + font_size + " " + font
    ctx.fillStyle    = @select(@text_font_color_name, obj)
    ctx.globalAlpha  = @select(@text_alpha_name,      obj)
    ctx.textAlign    = @select(@text_align_name,      obj)
    ctx.textBaseline = @select(@text_baseline_name,   obj)



class Glyph extends properties
  constructor: (styleprovider, glyphspec, attrnames, properties) ->
    for attrname in attrnames
      @setattr(styleprovider, glyphspec, attrname)

    for prop in properties
      @[prop.name] = new prop(styleprovider, glyphspec)

    # TODO auto detect fast path cases
    @fast_path = false
    if ('fast_path' of glyphspec)
      @fast_path = glyphspec.fast_path



exports.Glyph = Glyph
exports.fill_properties = fill_properties
exports.line_properties = line_properties
exports.text_properties = text_properties

