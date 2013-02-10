
glyph = require("../glyph")


Glyph = glyph.Glyph
line_properties = glyph.line_properties


bezier = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["x0", "y0", "x1", "y1", "cx0", "cy0", "cx1", "cy1"], [line_properties])

  x0 = (glyph.select("x0", obj) for obj in data)
  y0 = (glyph.select("y0", obj) for obj in data)
  [sx0, sy0] = view.map_to_screen(x0, x0.units, y0, y0.units)

  x1 = (glyph.select("x1", obj) for obj in data)
  y1 = (glyph.select("y1", obj) for obj in data)
  [sx1, sy1] = view.map_to_screen(x1, x1.units, y1, y1.units)

  cx0 = (glyph.select("cx0", obj) for obj in data)
  cy0 = (glyph.select("cy0", obj) for obj in data)
  [scx0, scy0] = view.map_to_screen(cx0, cx0.units, cy0, cy0.units)

  cx1 = (glyph.select("cx1", obj) for obj in data)
  cy1 = (glyph.select("cy1", obj) for obj in data)
  [scx1, scy1] = view.map_to_screen(cx1, cx1.units, cy1, cy1.units)

  if false # TODO fast path switching
    glyph.line_properties.set(ctx, glyph)
    ctx.beginPath()
    for i in [0..sx0.length-1]
      if isNaN(sx0[i] + sy0[i] + sx1[i] + sy1[i] + scx0[i] + scy0[i] + scx1[i] + scy1[i])
        continue
      ctx.moveTo(sx0[i], sy0[i])
      ctx.bezierCurveTo(scx0[i], scy0[i], scx1[i], scy1[i], sx1[i], sy1[i])
    ctx.stroke()

  else
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
