
glyph = require("../glyph")


Glyph = glyph.Glyph
line_properties = glyph.line_properties


arc = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["x", "y", "radius", "start_angle", "end_angle", "direction"], [line_properties])

  [sx, sy] = view.map_to_screen(glyph, "x", "y", data)
  radius = view.distance(glyph, data, "x", "radius", "edge")
  start_angle = (glyph.select("start_angle", obj) for obj in data) # TODO deg/rad
  end_angle = (glyph.select("end_angle", obj) for obj in data) # TODO deg/rad
  # TODO direction

  if false  # TODO fast path switching
    glyph.line_properties.set(ctx, glyph)
    for i in [0..sx.length-1]
      if isNaN(sx[i] + sy[i] + radius[i] + start_angle[i] + end_angle[i])
        continue
      ctx.beginPath()
      ctx.arc(sx[i], sy[i], radius[i], start_angle[i], end_angle[i], false) # TODO direction
      ctx.stroke()

  else
    for i in [0..sx.length-1]
      if isNaN(sx[i] + sy[i] + radius[i] + start_angle[i] + end_angle[i])
        continue

      ctx.beginPath()
      ctx.arc(sx[i], sy[i], radius[i], start_angle[i], end_angle[i], false) # TODO direction

      glyph.line_properties.set(ctx, data[i])
      ctx.stroke()

  ctx.restore()

exports.arc = arc
