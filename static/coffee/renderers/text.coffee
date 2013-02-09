
glyph = require("../glyph")


Glyph = glyph.Glyph
text_properties = glyph.text_properties


text = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()
  glyph = new Glyph(view, glyphspec, ["x", "y", "angle", "text:string"], [text_properties])

  [sx, sy] = view.map_to_screen(glyph, "x", "y", data)
  angle = (glyph.select("angle", obj) for obj in data) # TODO deg/rad
  text = (glyph.select("text", obj) for obj in data)

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
