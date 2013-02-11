
glyph = require("../glyph")


Glyph = glyph.Glyph
text_properties = glyph.text_properties


text = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()
  glyph = new Glyph(view, glyphspec, ["x", "y", "angle", "text:string"], [text_properties])

  x = (glyph.select("x", obj) for obj in data)
  y = (glyph.select("y", obj) for obj in data)
  [sx, sy] = view.map_to_screen(x, glyph.x.units, y, glyph.y.units)
  angle = (glyph.select("angle", obj) for obj in data) # TODO deg/rad
  text = (glyph.select("text", obj) for obj in data)

  if glyph.fast_path
    glyph.text_properties.set(ctx, glyph)
    for i in [0..sx.length-1]
      if isNaN(sx[i] + sy[i])
        continue

      if angle[i]
        ctx.translate(sx[i], sy[i])
        ctx.rotate(angle[i])
        ctx.fillText(text[i], 0, 0)
        ctx.rotate(-angle[i])
        ctx.translate(-sx[i], -sy[i])
      else
        ctx.fillText(text[i], sx[i], sy[i])

  else
    for i in [0..sx.length-1]
      if isNaN(sx[i] + sy[i])
        continue

      ctx.translate(sx[i], sy[i])
      ctx.rotate(angle[i])

      glyph.text_properties.set(ctx, data[i])
      ctx.fillText(text[i], 0, 0)

      ctx.rotate(-angle[i])
      ctx.translate(-sx[i], -sy[i])

  ctx.restore()


exports.text = text
