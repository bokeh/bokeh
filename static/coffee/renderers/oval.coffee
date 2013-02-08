
glyph = require("../glyph")


Glyph = glyph.Glyph
fill_properties = glyph.fill_properties


oval = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["x", "y", "width", "height", "angle"], [fill_properties])

  [sx, sy] = view.map_to_screen(glyph, data)
  sw = view.distance(glyph, data, "x", "width", "center")
  sh = view.distance(glyph, data, "y", "height", "center")
  angle = (glyph.select("angle", obj) for obj in data) # TODO deg/rad

  for i in [0..sx.length-1]

    if isNaN(sx[i] + sy[i] + sw[i] + sh[i] + angle[i])
      continue

    ctx.translate(sx[i], sy[i])
    ctx.scale(sw[i], sh[i])
    ctx.rotate(angle[i])

    ctx.beginPath()
    ctx.arc(0, 0, 1, 0, 2*Math.PI, false);

    glyph.fill_properties.set(ctx, data[i])
    ctx.fill()

    ctx.rotate(-angle[i])
    ctx.scale(1/sw[i], 1/sh[i])
    ctx.translate(-sx[i], -sy[i])

  ctx.restore()


exports.oval = oval