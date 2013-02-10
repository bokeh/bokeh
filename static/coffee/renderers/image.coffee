
glyph = require("../glyph")


Glyph = glyph.Glyph
text_properties = glyph.text_properties


image = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()
  glyph = new Glyph(view, glyphspec, ["image:string", "x", "y", "angle"], [])

  [sx, sy] = view.map_to_screen(glyph, "x", "y", data)
  image = (glyph.select("image", obj) for obj in data)
  angle = (glyph.select("angle", obj) for obj in data) # TODO deg/rad
  text = (glyph.select("text", obj) for obj in data)

  # fast and slow paths are the same
  for i in [0..sx.length-1]
    if isNaN(sx[i] + sy[i]+ angle[i])
      continue

    img = new Image()
    img.onload = do (img, sx, sy, i) ->
      return () ->
        ctx.translate(sx[i], sy[i])
        ctx.rotate(angle[i])
        ctx.drawImage(img, 0, 0);
        ctx.rotate(-angle[i])
        ctx.translate(-sx[i], -sy[i])
    img.src = image[i]

  ctx.restore()


exports.image = image
