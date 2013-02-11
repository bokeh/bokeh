
glyph = require("../glyph")


Glyph = glyph.Glyph
line_properties = glyph.line_properties


arc = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["x", "y", "radius", "start_angle", "end_angle", "direction:string"], [line_properties])

  x = (glyph.select("x", obj) for obj in data)
  y = (glyph.select("y", obj) for obj in data)
  [sx, sy] = view.map_to_screen(x, glyph.x.units, y, glyph.y.units)
  radius = view.distance(glyph, data, "x", "radius", "edge")
  start_angle = (glyph.select("start_angle", obj) for obj in data) # TODO deg/rad
  end_angle = (glyph.select("end_angle", obj) for obj in data) # TODO deg/rad
  direction = new Array(sx.length)
  for i in [0..sx.length-1]
    dir = glyph.select("direction", data[i])
    if dir == "clock" then direction[i] = false
    else if dir == "anticlock" then direction[i] = true
    else direction[i] = NaN

  if glyph.fast_path
    glyph.line_properties.set(ctx, glyph)
    for i in [0..sx.length-1]
      if isNaN(sx[i] + sy[i] + radius[i] + start_angle[i] + end_angle[i] + direction[i])
        continue
      ctx.beginPath()
      ctx.arc(sx[i], sy[i], radius[i], start_angle[i], end_angle[i], direction[i])
      ctx.stroke()

  else
    for i in [0..sx.length-1]
      if isNaN(sx[i] + sy[i] + radius[i] + start_angle[i] + end_angle[i])
        continue

      ctx.beginPath()
      ctx.arc(sx[i], sy[i], radius[i], start_angle[i], end_angle[i], direction[i])

      glyph.line_properties.set(ctx, data[i])
      ctx.stroke()

  ctx.restore()

exports.arc = arc
