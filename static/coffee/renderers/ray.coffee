
glyph = require("../glyph")


Glyph = glyph.Glyph
line_properties = glyph.line_properties


ray = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["x", "y", "angle", "length"], [line_properties])

  [sx, sy] = view.map_to_screen(glyph, "x", "y", data)
  angle = (glyph.select("angle", obj) for obj in data) # TODO deg/rad
  length = (glyph.select("length", obj) for obj in data)

  for i in [0..sx.length-1]

    if isNaN(sx[i] + sy[i] + angle[i] + length[i])
      continue

    ctx.translate(sx[i], sy[i])
    ctx.rotate(angle[i])

    ctx.beginPath()
    ctx.moveTo(0,0)
    ctx.lineTo(0, -length[i])  # TODO handle y flip elsewhere?
                               # TODO handle length in data units
                               # TODO unbounded length

    glyph.line_properties.set(ctx, data[i])
    ctx.stroke()

    ctx.rotate(-angle[i])
    ctx.translate(-sx[i], -sy[i])

  ctx.restore()


exports.ray = ray
