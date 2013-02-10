
glyph = require("../glyph")


Glyph = glyph.Glyph
fill_properties = glyph.fill_properties
line_properties = glyph.line_properties


wedge = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["x", "y", "radius", "start_angle", "end_angle"], [fill_properties, line_properties])

  x = (glyph.select("x", obj) for obj in data)
  y = (glyph.select("y", obj) for obj in data)
  [sx, sy] = view.map_to_screen(x, x.units, y, y.units)
  radius = view.distance(glyph, data, "x", "radius", "edge")
  start_angle = (glyph.select("start_angle", obj) for obj in data) # TODO deg/rad
  end_angle = (glyph.select("end_angle", obj) for obj in data) # TODO deg/rad

  if false # TODO fast path switching
    glyph.fill_properties.set(ctx, glyph)
    for i in [0..sx.length-1]
      if isNaN(sx[i] + sy[i] + radius[i] + start_angle[i] + end_angle[i])
        continue

      ctx.beginPath()
      ctx.arc(sx[i], sy[i], radius[i], start_angle[i], end_angle[i], false)
      ctx.lineTo(sx[i], sy[i])
      ctx.closePath()
      ctx.fill()

    glyph.line_properties.set(ctx, glyph)
    for i in [0..sx.length-1]
      if isNaN(sx[i] + sy[i] + radius[i] + start_angle[i] + end_angle[i])
        continue

      ctx.beginPath()
      ctx.arc(sx[i], sy[i], radius[i], start_angle[i], end_angle[i], false)
      ctx.lineTo(sx[i], sy[i])
      ctx.closePath()
      ctx.stroke()

  else
    for i in [0..sx.length-1]
      if isNaN(sx[i] + sy[i] + radius[i] + start_angle[i] + end_angle[i])
        continue

      ctx.beginPath()
      ctx.arc(sx[i], sy[i], radius[i], start_angle[i], end_angle[i], false)
      ctx.lineTo(sx[i], sy[i])
      ctx.closePath()

      glyph.fill_properties.set(ctx, data[i])
      ctx.fill()

      glyph.line_properties.set(ctx, data[i])
      ctx.stroke()

  ctx.restore()


exports.wedge = wedge
