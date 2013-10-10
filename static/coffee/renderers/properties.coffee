
svg_colors = require('../common/svg_colors').svg_colors

class properties

  string: (styleprovider, glyphspec, attrname) ->
    @[attrname] = {}

    default_value = styleprovider.mget(attrname)
    if not default_value?
    else if _.isString(default_value)
      @[attrname].default = default_value
    else
      console.log("string property '#{ attrname }' given invalid default value: " + default_value)

    if not glyphspec? or not (attrname of glyphspec)
      return

    glyph_value = glyphspec[attrname]
    if _.isString(glyph_value)
      @[attrname].value = glyph_value
    else if _.isObject(glyph_value)
      @[attrname] = _.extend(@[attrname], glyph_value)
    else
      console.log("string property '#{ attrname }' given invalid glyph value: " + glyph_value)

  number: (styleprovider, glyphspec, attrname) ->
    @[attrname] = { typed: true }

    default_value = styleprovider.mget(attrname)
    if not default_value?
    else if _.isNumber(default_value)
      @[attrname].default = default_value
    else
      console.log("number property '#{ attrname }' given invalid default value: " + default_value)

    units_value = styleprovider.mget(attrname+'_units') ? 'data'
    if glyphspec? and (attrname+'_units' of glyphspec)
      units_value = glyphspec[attrname+'_units']
    @[attrname].units = units_value

    if not glyphspec? or not (attrname of glyphspec)
      return

    glyph_value = glyphspec[attrname]
    if _.isString(glyph_value)
      @[attrname].field = glyph_value
    else if _.isNumber(glyph_value)
      @[attrname].value = glyph_value
    else if _.isObject(glyph_value)
      @[attrname] = _.extend(@[attrname], glyph_value)
    else
      console.log("number property '#{ attrname }' given invalid glyph value: " + glyph_value)

  color: (styleprovider, glyphspec, attrname) ->
    @[attrname] = {}

    default_value = styleprovider.mget(attrname)
    if _.isUndefined(default_value)
      @[attrname].default = null
    else if _.isString(default_value) and (svg_colors[default_value]? or default_value.substring(0, 1) == "#") or _.isNull(default_value)
      @[attrname].default = default_value
    else
      console.log("color property '#{ attrname }' given invalid default value: " + default_value)

    if not glyphspec? or not (attrname of glyphspec)
      return

    glyph_value = glyphspec[attrname]
    if _.isNull(glyph_value)
      @[attrname].value = null
    else if _.isString(glyph_value)
      if svg_colors[glyph_value]? or glyph_value.substring(0, 1) == "#"
        @[attrname].value = glyph_value
      else
        @[attrname].field = glyph_value
    else if _.isObject(glyph_value)
      @[attrname] = _.extend(@[attrname], glyph_value)
    else
      console.log("color property '#{ attrname }' given invalid glyph value: " + glyph_value)

  array: (styleprovider, glyphspec, attrname) ->
    @[attrname] = {}

    default_value = styleprovider.mget(attrname)
    if not default_value?
    else if _.isArray(default_value)
      @[attrname].default = default_value
    else
      console.log("array property '#{ attrname }' given invalid default value: " + default_value)

    units_value = styleprovider.mget(attrname+"_units") ? 'data'
    if glyphspec? and (attrname+'_units' of glyphspec)
      units_value = glyphspec[attrname+'_units']
    @[attrname].units = units_value

    if not glyphspec? or not (attrname of glyphspec)
      return

    glyph_value = glyphspec[attrname]
    if _.isString(glyph_value)
      @[attrname].field = glyph_value
    else if _.isArray(glyph_value)
      @[attrname].value = glyph_value
    else if _.isObject(glyph_value)
      @[attrname] = _.extend(@[attrname], glyph_value)
    else
      console.log("array property '#{ attrname }' given invalid glyph value: " + glyph_value)

  enum: (styleprovider, glyphspec, attrname, vals) ->
    @[attrname] = {}

    levels = vals.split(" ")

    default_value = styleprovider.mget(attrname)
    if _.isNull(default_value)
    else if _.isString(default_value) and default_value in levels
      @[attrname] = {default: default_value}
    else
      console.log("enum property '#{ attrname }' given invalid default value: " + default_value)
      console.log("    acceptable values:" + levels)

    if not glyphspec? or not (attrname of glyphspec)
      return

    glyph_value = glyphspec[attrname]
    if _.isString(glyph_value)
      if glyph_value in levels
        @[attrname].value = glyph_value
      else
        @[attrname].field = glyph_value
    else if _.isObject(glyph_value)
      @[attrname] = _.extend(@[attrname], glyph_value)
    else
      console.log("enum property '#{ attrname }' given invalid glyph value: " + glyph_value)
      console.log("    acceptable values:" + levels)

  setattr: (styleprovider, glyphspec, attrname, attrtype) ->
    values = null
    if attrtype.indexOf(":") > -1
      [attrtype, values] = attrtype.split(":")

    if      attrtype == "string" then @string(styleprovider, glyphspec, attrname)
    else if attrtype == "number" then @number(styleprovider, glyphspec, attrname)
    else if attrtype == "color"  then @color(styleprovider, glyphspec, attrname)
    else if attrtype == "array"  then @array(styleprovider, glyphspec, attrname)
    else if attrtype == "enum" and values
      @enum(styleprovider, glyphspec, attrname, values)
    else
      console.log("Unknown type '#{ attrtype }' for glyph property: " + attrname)

  select: (attrname, obj) ->

    # if the attribute is not on this property object at all, log a bad request
    if not (attrname of @)
      console.log("requested selection of unknown property '#{ attrname }' on object: " + obj)
      return

    # if the attribute specifies a field, and the field exists on the object, return that value
    if @[attrname].field? and (@[attrname].field of obj)
      return obj[@[attrname].field]

    # If the user gave an explicit value, that should always be returned
    if @[attrname].value?
      return @[attrname].value

    # otherwise, if the attribute exists on the object, return that value.
    # (This is a convenience case for when the object passed in has a member
    # that has the same name as the glyphspec name, e.g. an actual field
    # named "x" or "radius".)
    if obj[attrname]?
      return obj[attrname]

    # finally, check for a default value on this property object that could be returned
    if @[attrname].default?
      return @[attrname].default

    # failing that, just log a problem
    else
      console.log "selection for attribute '#{ attrname }' failed on object: #{ obj }"

  v_select: (attrname, objs) ->

    # if the attribute is not on this property object at all, log a bad request
    if not (attrname of @)
      console.log("requested vector selection of unknown property '#{ attrname }' on objects")
      return

    if @[attrname].typed?
      result = new Float32Array(objs.length)
    else
      result = new Array(objs.length)

    for i in [0..objs.length-1]

      obj = objs[i]

      # if the attribute specifies a field, and the field exists on the object, return that value
      if @[attrname].field? and (@[attrname].field of obj)
        result[i] = obj[@[attrname].field]

      # If the user gave an explicit value, that should always be returned
      else if @[attrname].value?
        result[i] = @[attrname].value

      # otherwise, if the attribute exists on the object, return that value
      else if obj[attrname]?
        result[i] = obj[attrname]

      # finally, check for a default value on this property object that could be returned
      else if @[attrname].default?
        result[i] = @[attrname].default

      # failing that, just log a problem
      else
        console.log "vector selection for attribute '#{ attrname }' failed on object: #{ obj }"
        return

    return result


class line_properties extends properties
  constructor: (styleprovider, glyphspec, prefix="") ->
    @line_color_name        = "#{ prefix }line_color"
    @line_width_name        = "#{ prefix }line_width"
    @line_alpha_name        = "#{ prefix }line_alpha"
    @line_join_name         = "#{ prefix }line_join"
    @line_cap_name          = "#{ prefix }line_cap"
    @line_dash_name         = "#{ prefix }line_dash"
    @line_dash_offset_name  = "#{ prefix }line_dash_offset"

    @color(styleprovider, glyphspec, @line_color_name)
    @number(styleprovider, glyphspec, @line_width_name)
    @number(styleprovider, glyphspec, @line_alpha_name)
    @enum(styleprovider, glyphspec, @line_join_name, "miter round bevel")
    @enum(styleprovider, glyphspec, @line_cap_name, "butt round square")
    @array(styleprovider, glyphspec, @line_dash_name)
    @number(styleprovider, glyphspec, @line_dash_offset_name)

    @do_stroke = true
    if not _.isUndefined(@[@line_color_name].value)
      if _.isNull(@[@line_color_name].value)
        @do_stroke = false
    else if _.isNull(@[@line_color_name].default)
      @do_stroke = false

  set: (ctx, obj) ->
    ctx.strokeStyle = @select(@line_color_name, obj)
    ctx.globalAlpha = @select(@line_alpha_name, obj)
    ctx.lineWidth   = @select(@line_width_name, obj)
    ctx.lineJoin    = @select(@line_join_name,  obj)
    ctx.lineCap     = @select(@line_cap_name,   obj)
    ctx.setLineDash(@select(@line_dash_name, obj))
    ctx.setLineDashOffset(@select(@line_dash_offset_name, obj))


class fill_properties extends properties
  constructor: (styleprovider, glyphspec, prefix="") ->
    @fill_color_name = "#{ prefix }fill_color"
    @fill_alpha_name = "#{ prefix }fill_alpha"

    @color(styleprovider, glyphspec, @fill_color_name)
    @number(styleprovider, glyphspec, @fill_alpha_name)

    @do_fill = true
    if not _.isUndefined(@[@fill_color_name].value)
      if _.isNull(@[@fill_color_name].value)
        @do_fill = false
    else if _.isNull(@[@fill_color_name].default)
      @do_fill = false

  set: (ctx, obj) ->
    ctx.fillStyle   = @select(@fill_color_name, obj)
    ctx.globalAlpha = @select(@fill_alpha_name, obj)



class text_properties extends properties
  constructor: (styleprovider, glyphspec, prefix="") ->
    @text_font_name       = "#{ prefix }text_font"
    @text_font_size_name  = "#{ prefix }text_font_size"
    @text_font_style_name = "#{ prefix }text_font_style"
    @text_color_name      = "#{ prefix }text_color"
    @text_alpha_name      = "#{ prefix }text_alpha"
    @text_align_name      = "#{ prefix }text_align"
    @text_baseline_name   = "#{ prefix }text_baseline"

    @string(styleprovider, glyphspec, @text_font_name)
    @string(styleprovider, glyphspec, @text_font_size_name)
    @enum(styleprovider, glyphspec, @text_font_style_name, "normal italic bold")
    @color(styleprovider, glyphspec, @text_color_name)
    @number(styleprovider, glyphspec, @text_alpha_name)
    @enum(styleprovider, glyphspec, @text_align_name, "left right center")
    @enum(styleprovider, glyphspec, @text_baseline_name, "top middle bottom alphabetic hanging")

  font:(obj, font_size) ->
    if not font_size?
      font_size = @select(@text_font_size_name,  obj)
    font       = @select(@text_font_name,       obj)
    font_style = @select(@text_font_style_name, obj)
    font = font_style + " " + font_size + " " + font
    return font

  set: (ctx, obj) ->
    ctx.font         = @font(obj)
    ctx.fillStyle    = @select(@text_color_name,    obj)
    ctx.globalAlpha  = @select(@text_alpha_name,    obj)
    ctx.textAlign    = @select(@text_align_name,    obj)
    ctx.textBaseline = @select(@text_baseline_name, obj)



class glyph_properties extends properties
  constructor: (styleprovider, glyphspec, attrnames, properties) ->
    for attrname in attrnames
      attrtype = "number"
      if attrname.indexOf(":") > -1
        [attrname, attrtype] = attrname.split(":")
      @setattr(styleprovider, glyphspec, attrname, attrtype)

    for prop in properties
      @[prop.constructor.name] = prop

    # TODO auto detect fast path cases
    @fast_path = false
    if ('fast_path' of glyphspec)
      @fast_path = glyphspec.fast_path



exports.glyph_properties = glyph_properties
exports.fill_properties = fill_properties
exports.line_properties = line_properties
exports.text_properties = text_properties
