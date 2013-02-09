

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
  constructor: (styleprovider, glyphspec) ->
    attrnames = ["line_color:string", "line_width", "line_alpha", "line_join:string", "line_cap:string", "line_dash:string"]
    for attrname in attrnames
      @setattr(styleprovider, glyphspec, attrname)

  set: (ctx, obj) ->
    ctx.strokeStyle = @select("line_color", obj)
    ctx.globalAlpha = @select("line_alpha", obj)
    ctx.lineWidth   = @select("line_width", obj)
    ctx.lineJoin    = @select("line_join", obj)
    ctx.lineCap     = @select("line_cap", obj)
    ctx.setLineDash(@select("line_dash", obj))
    # dash offset/phase unimplemented



class fill_properties extends properties
  constructor: (styleprovider, glyphspec) ->
    attrnames = ["fill:string", "fill_alpha"]
    for attrname in attrnames
      @setattr(styleprovider, glyphspec, attrname)

  set: (ctx, obj) ->
    ctx.fillStyle   = @select("fill", obj)
    ctx.globalAlpha = @select("fill_alpha", obj)



class text_properties extends properties
  constructor: (styleprovider, glyphspec) ->
    attrnames = ["font:string", "font_size:string", "font_style:string", "font_color", "font_alpha", "text_align:string", "text_baseline:string"]
    for attrname in attrnames
      @setattr(styleprovider, glyphspec, attrname)

  set: (ctx, obj) ->
    font = @select("font", obj)
    font_size = @select("font_size", obj)
    font_style = @select("font_style", obj)

    ctx.font         = font_style + " " + font_size + " " + font
    ctx.fillStyle    = @select("font_color", obj)
    ctx.globalAlpha  = @select("text_alpha", obj)
    ctx.textAlign    = @select("text_align", obj)
    ctx.textBaseline = @select("text_baseline", obj)



class Glyph extends properties
  constructor: (styleprovider, glyphspec, attrnames, properties) ->
    for attrname in attrnames
      @setattr(styleprovider, glyphspec, attrname)

    for prop in properties
      @[prop.name] = new prop(styleprovider, glyphspec)


exports.Glyph = Glyph
exports.fill_properties = fill_properties
exports.line_properties = line_properties
exports.text_properties = text_properties

