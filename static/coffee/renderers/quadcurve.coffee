
glyph = require("../glyph")


Glyph = glyph.Glyph
line_properties = glyph.line_properties


quadcurve = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["x0", "y0", "x1", "y1", "cx", "cy"], [line_properties])

  [sx0, sy0] = view.map_to_screen(glyph, "x0", "y0", data)
  [sx1, sy1] = view.map_to_screen(glyph, "x1", "y1", data)
  [scx, scy] = view.map_to_screen(glyph, "cx", "cy", data)

  for i in [0..sx0.length-1]

    if isNaN(sx0[i] + sy0[i] + sx1[i] + sy1[i] + scx[i] + scy[i])
      continue

    ctx.beginPath()
    ctx.moveTo(sx0[i], sy0[i])
    ctx.quadraticCurveTo(scx[i], scy[i], sx1[i], sy1[i])

    glyph.line_properties.set(ctx, data[i])
    ctx.stroke()

  ctx.restore()


exports.quadcurve = quadcurve
