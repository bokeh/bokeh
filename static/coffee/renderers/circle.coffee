
glyph = require("../glyph")


Glyph = glyph.Glyph
line_properties = glyph.line_properties
fill_properties = glyph.fill_properties


circle = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()
  glyph = new Glyph(view, glyphspec, ["x", "y", "radius"], [fill_properties, line_properties])

  [sx, sy] = view.map_to_screen(glyph, "x", "y", data)
  radius = view.distance(glyph, data, "x", "radius", "edge")

  for i in [0..sx.length-1]

    if isNaN(sx[i] + sy[i] + radius[i])
      continue

    ctx.beginPath()
    ctx.arc(sx[i], sy[i], radius[i], 0, 2*Math.PI*2, false)

    glyph.fill_properties.set(ctx, data[i])
    ctx.fill()

    glyph.line_properties.set(ctx, data[i])
    ctx.stroke()

  ctx.restore()



exports.circle = circle
