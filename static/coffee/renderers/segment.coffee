
glyph = require("../glyph")


Glyph = glyph.Glyph
line_properties = glyph.line_properties


segment = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["x0", "y0", "x1", "y1"], [line_properties])

  x0 = (glyph.select("x0", obj) for obj in data)
  y0 = (glyph.select("y0", obj) for obj in data)
  [sx0, sy0] = view.map_to_screen(x0, x0.units, y0, y0.units)

  x1 = (glyph.select("x1", obj) for obj in data)
  y1 = (glyph.select("y1", obj) for obj in data)
  [sx1, sy1] = view.map_to_screen(x1, x1.units, y1, y1.units)

  if false # TODO fast patch switching
    glyph.line_properties.set(ctx, glyph)
    ctx.beginPath()
    for i in [0..sx0.length-1]
      if isNaN(sx0[i] + sy0[i] + sx1[i] + sy1[i])
        continue

      ctx.moveTo(sx0[i], sy0[i])
      ctx.lineTo(sx1[i], sy1[i])

    ctx.stroke()

  else
    for i in [0..sx0.length-1]
      if isNaN(sx0[i] + sy0[i] + sx1[i] + sy1[i])
        continue

      ctx.beginPath()
      ctx.moveTo(sx0[i], sy0[i])
      ctx.lineTo(sx1[i], sy1[i])

      glyph.line_properties.set(ctx, data[i])
      ctx.stroke()

  ctx.restore()


exports.segment = segment
