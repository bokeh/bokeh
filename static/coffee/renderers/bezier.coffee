
glyph = require("../glyph")


Glyph = glyph.Glyph
line_properties = glyph.line_properties


bezier = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["x0", "y0", "x1", "y1", "cx0", "cy0", "cx1", "cy1"], [line_properties])

  [sx0, sy0] = view.map_to_screen(glyph, "x0", "y0", data)
  [sx1, sy1] = view.map_to_screen(glyph, "x1", "y1", data)
  [scx0, scy0] = view.map_to_screen(glyph, "cx0", "cy0", data)
  [scx1, scy1] = view.map_to_screen(glyph, "cx1", "cy1", data)

  for i in [0..sx0.length-1]

    if isNaN(sx0[i] + sy0[i] + sx1[i] + sy1[i] + scx0[i] + scy0[i] + scx1[i] + scy1[i])
      continue

    ctx.beginPath()
    ctx.moveTo(sx0[i], sy0[i])
    ctx.bezierCurveTo(scx0[i], scy0[i], scx1[i], scy1[i], sx1[i], sy1[i])

    glyph.line_properties.set(ctx, data[i])
    ctx.stroke()

  ctx.restore()


exports.bezier = bezier
