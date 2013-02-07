#Setup Bokeh Module
base = require("./base")
schema_renderers = require("./schema_renderers")
XYRendererView = schema_renderers.XYRendererView
HasParent = base.HasParent
safebind = base.safebind


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
      if attrtype != "string"
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
  constructor: (styleprovider, glyphsepc) ->
    attrnames = ["fill", "fill_alpha"]
    for attrname in attrnames
      @setattr(styleprovider, glyphspec, attrname)

  set: (ctx, obj) ->
    ctx.fillStyle   = @select("fill:string", obj)
    ctx.globalAlpha = @select("fill_alpha", obj)




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

  [sx, sy] = view.screen(glyph, data)
  radius = view.distance(glyph, data, "x", "radius", "edge")

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

  [sx, sy] = view.map_to_screen(glyph, data)
  sw = view.distance(glyph, data, "x", "width", "center")
  sh = view.distance(glyph, data, "y", "height", "center")
  angle = (glyph.select("angle", obj) if glyph.angle_units == "radians" else glyph.select("angle", obj) * 2 * Math.PI / 360.0 for obj in data)
  #direction = (true if glyph.select("direction", obj) == "clockwise" else false for obj in data)

  for i in [0..len(sx)-1]

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

  [sx, sy] = view.map_to_screen(glyph, data)
  sw = view.distance(glyph, data, "x", "width", "center")
  sh = view.distance(glyph, data, "y", "height", "center")
  angle = (angle if glyph.select("angle_units", obj) == "radians" else angle * 2 * Math.PI / 360.0 for obj in data)

  for i in [0..len(sx)-1]

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




class GlyphRendererView extends XYRendererView
  constructor: () ->
    @circle = circle
    @oval = oval
    @rect = rect

  render: () ->
    console.log("FOOOOOOOOOO")
    source = @mget_obj('data_source')
    if source.type == "ObjectArrayDataSource"
      data = source.get('data')
    else if source.type == "ColumnDataSource"
      data = source.datapoints()
    else
      console.log("Unknown data source type: " + source.type)

    for glyph in @mget('glyphs')
      console.log "Glyph: " + glyph
      if @[glyph.type]?
        @[glyph.type](glyph, data)
      else
        console.log("Unknown glyph type: " + glyph.type)

  distance: (glyph, data, pt, span, position) ->
    results = new Array(len(data))

    pt_units = glyph[pt+"_units"]
    span_units = glyph[span+"_units"]
    if pt == "x"
      mapper = @xmapper
    else if pt == "y"
      mapper = @ymapper

    if position == "center"

      for i in [0..len(data)-1]
        halfspan = glyph.select(span, data[i]) / 2
        if span_units == "screen"
          results[i] = 2 * halfspan
          continue
        ptc = glyph.select(pt, data[i])
        if pt_units == "screen"
          ptc = mapper.map_data(ptc)
        pt0 = ptc - halfspan
        pt1 = ptc + halfspan
        spt0 = mapper.map_screen(pt0)
        spt1 = mapper.map_screen(pt1)
        results[i] = spt1 - spt0

    else

      for i in [0..len(data)-1]
        halfspan = glyph.select(span, data[i])
        if span_units == "screen"
          results[i] = 2 * halfspan
          continue
        pt0 = glyph.select(pt, data[i])
        if pt_units == "screen"
          pt0 = mapper.map_data(pt0)
        pt1 = pt0 + halfspan
        spt0 = mapper.map_screen(pt0)
        spt1 = mapper.map_screen(pt1)
        results[i] = spt1 - spt0

    return results

  map_to_screen : (glyph, data) ->
    sx = new Array(len(data))
    sy = new Array(len(data))

    x_units = glyph["x_units"]
    y_units = glyph["y_units"]

    if x_units == "screen"
      for i in [0..len(data)-1]
        sx[i] = glyph.select("x", data[i])
    else
      for i in [0..len(data)-1]
        sx[i] = @xmapper.map_screen(glyph.select("x", data[i]))

    if y_units == "screen"
      for i in [0..len(data)-1]
        sy[i] = glyph.select("y", data[i])
    else
      for i in [0..len(data)-1]
        sy[i] = @ymapper(glyph.select("y", data[i]))

    return [sx, sy]


class GlyphRenderer extends HasParent
  type : 'GlyphRenderer'
  default_view : GlyphRendererView


GlyphRenderer::defaults = _.clone(GlyphRenderer::defaults)
_.extend(GlyphRenderer::defaults,
  data_source : null
)


GlyphRenderer::display_defaults = _.clone(GlyphRenderer::display_defaults)
_.extend(GlyphRenderer::display_defaults, {

  fill : "gray"
  fill_alpha: 1

  line_color: 'red'
  line_width: 1
  line_alpha: 1
  line_join: "miter"
  line_cap: "butt"
  line_dash: ""

  radius : 5
  radius_units: "screen"

  angle_units: 'deg'

})


class GlyphRenderers extends Backbone.Collection
  model : GlyphRenderer

exports.glyphrenderers = new GlyphRenderers
exports.GlyphRendererView = GlyphRendererView
exports.GlyphRenderer = GlyphRenderer
