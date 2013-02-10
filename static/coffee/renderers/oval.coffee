
glyph = require("../glyph")


Glyph = glyph.Glyph
fill_properties = glyph.fill_properties
line_properties = glyph.line_properties


oval = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["x", "y", "width", "height", "angle"], [fill_properties, line_properties])

  [sx, sy] = view.map_to_screen(glyph, "x", "y", data)
  sw = view.distance(glyph, data, "x", "width", "center")
  sh = view.distance(glyph, data, "y", "height", "center")
  angle = (glyph.select("angle", obj) for obj in data) # TODO deg/rad

  for i in [0..sx.length-1]

    if isNaN(sx[i] + sy[i] + sw[i] + sh[i] + angle[i])
      continue

    ctx.translate(sx[i], sy[i])
    ctx.rotate(angle[i])

    ctx.beginPath()
    ctx.moveTo(0, -sh[i]/2)
    ctx.bezierCurveTo( sw[i]/2, -sh[i]/2,  sw[i]/2,  sh[i]/2, 0,  sh[i]/2);
    ctx.bezierCurveTo(-sw[i]/2,  sh[i]/2, -sw[i]/2, -sh[i]/2, 0, -sh[i]/2);
    ctx.closePath()

    glyph.fill_properties.set(ctx, data[i])
    ctx.fill()

    glyph.line_properties.set(ctx, data[i])
    ctx.stroke()

    ctx.rotate(-angle[i])
    ctx.translate(-sx[i], -sy[i])

  ctx.restore()


exports.oval = oval