


class properties

  setattr: (styleprovider, glyphspec, attrname) ->
    attrtype = "number"
    if attrname.indexOf(":") > -1
      [attrname, attrtype] = attrname.split(":")

    default_value = @styleprovider.mget(attrname)
    default_units = @styleprovider.mget(attrname+"_units") ? 'data'

    obj = {default: default_value, units: default_units }

    # if the attribute is not on the glyphspec, use the defaults
    if not (attrname of glyphspec)
      @[attrname] = obj
      return

    glyph_value = glyphspec[attrname]

    # if the attribute is a string, use the its value as the field or default
    if _.isString(glyph_value)
      if attrtype != "string":
        obj.field = glyphspec[attrname]
      else
        obj.default = glyphspec[attrname]

    # if the attribute is a number use its value as the default
    else if _.isNumber(glyph_value)
      obj.field = glyphspec[attrname]

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
    return @[attrname].default


class line_properties extends properties
  constructor: (styleprovider, glyphspec) ->
    attrnames = ["line_color", "line_width", "line_alpha", "line_join", "line_cap", "line_dash"]
    for attrname in attrnames
      @setattr(styleprovider, glyphspec, attrname)

  set: (ctx, obj) ->
    ctx.strokeStyle = if @line_color.field? then obj[@line_color.field] else @line_color.default
    ctx.globalAlpha = if @line_alpha.field? then obj[@line_alpha.field] else @line_alpha.default
    ctx.lineWidth   = if @line_width.field? then obj[@line_width.field] else @line_width.default
    ctx.lineJoin    = if @line_join.field?  then obj[@line_join.field]  else @line_join.default
    ctx.lineCap     = if @line_cap.field?   then pt[@line_cap.field]   else @line_cap.default
    ctx.setLineDash(if @line_dash.field? then obj[@line_dash.field] else @line_dash.default)
    # dash offset/phase unimplemented



class fill_properties extends properties
  constructor: (styleprovider, glyphsepc) ->
    attrnames = ["fill", "fill_alpha"]
    for attrname in attrnames
      @setattr(styleprovider, glyphspec, attrname)

  set: (ctx, obj) ->
    ctx.fillStyle   = if @fill.field?       then obj[@fill.field]       else @fill.default
    ctx.globalAlpha = if @fill_alpha.field? then obj[@fill_alpha.field] else @fill_alpha.default





class Glyph extends properties
  constructor: (styleprovider, glyphspec, attrnames, properties) ->
    for attrname in attrnames
      @setattr(styleprovider, glyphspec, attrname)

    for prop in properties
      @[prop.name] = new prop(styleprovider, glyphspec)





circle = (view, glyphspec, data) ->
  ctx = view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["x", "y", "radius"], [fill_properties, line_properties])

  sx, sy = glyph.screen(data, "x", "y")
  radius = glyph.distance(data, "x", "radius")

  for i in [0, len(sx)-1]

    if isNaN(sx[i] + sy[i] + radius[i])
      continue

    ctx.beginPath()
    ctx.arc(sx[i], sy[i], radius[i], 0, 2*Math.PI*2, false)

    glyph.fill_properties.set(ctx, data[i])
    ctx.fill()

    glyph.line_properties.set(ctx, data[i])
    ctx.stroke()

  ctx.restore()





oval = (view, glyphspec, data) ->
  ctx = view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["x", "y", "width", "height", "angle", "direction"], [fill_properties, line_properties])

  [sx, sy] = glyph.screen(data, "x", "y")
  sw = glyph.distance(data, "x", "width")
  sh = glyph.distance(data, "y", "height")
  angle = glyph.radians(data, "angle")
  direction = glyph.test(data, "direction", "clockwise")

  for i in [0, len(sx)-1]

    if isNaN(sx[i] + sy[i] + sw[i] + sh[i] + angle[i])
      continue

    # need an extra save and restore inside the loop to undo the scaling correctly
    ctx.save()

    ctx.translate(sx[i], sy[i])
    ctx.scale(sw[i], sh[i])
    ctx.rotate(angle[i])

    ctx.beginPath()
    ctx.arc(0, 0, 1, 0, 2*Math.PI, direction[i]);

    glyph.fill_properties.set(ctx, data[i])
    ctx.fill()

    glyph.line_properties.set(ctx, data[i])
    ctx.stroke()

    ctx.restore

  ctx.restore()





rect = (view, glyphspec, data) ->
  ctx = view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["x", "y", "width", "height", "angle"], [fill_properties, line_properties])

  [sx, sy] = glyph.screen(data, "x", "y")
  sw = glyph.distance(data, "x", "width")
  sh = glyph.distance(data, "y", "height")
  angle = glyph.radians(data, "angle")

  for i in [0, len(sx)-1]

    if isNaN(sx[i] + sy[i] + sw[i] + sh[i] + angle[i])
      continue

    if angle[i]
      ctx.translate(sx[i], sy[i])
      ctx.rotate(angle[i])

    ctx.beginPath()
    ctx.rect(sx[i], sy[i], sw[i], sh[i])

    glyph.fill_properties.set(ctx, data[i])
    ctx.fill()

    glyph.line_properties.set(ctx, data[i])
    ctx.stroke()

    if angle[i]
      ctx.rotate(-angle[i])
      ctx.translate(-sx[i], -sy[i])

  ctx.restore()




class GlyphRendererView extends Bokeh.XYRendererView
  constructor: () ->
    @circle = circle
    @oval = oval
    @rect = rect

  render : ->
    source = @mget_obj('data_source')
    if source.type == "ObjectArrayDataSource"
      data = source.get('data')
    else if source.type == "ColumnDataSource"
      data = source.datapoints()
    else
      console.log("Unknown data source type: " + source.type)

    for glyph in @mget('glyphs')
      if @[glyph.type]?
        @[glyph.type](glyph, data)
      else
        console.log("Unknown glyph type: " + glyph.type)

