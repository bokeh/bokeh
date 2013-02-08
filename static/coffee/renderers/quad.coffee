
glyph = require("../glyph")


Glyph = glyph.Glyph
line_properties = glyph.line_properties
fill_properties = glyph.fill_properties


quad = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["left", "right", "bottom", "top"], [fill_properties, line_properties])

  [sx0, sy0] = view.map_to_screen(glyph, "left", "top", data)
  [sx1, sy1] = view.map_to_screen(glyph, "right", "bottom", data)

  for i in [0..sx0.length-1]

    if isNaN(sx0[i] + sy0[i] + sx1[i] + sy1[i])
      continue

    ctx.beginPath()
    ctx.rect(sx0[i], sy0[i], sx1[i]-sx0[i], sy1[i]-sy0[i])

    glyph.fill_properties.set(ctx, data[i])
    ctx.fill()

    glyph.line_properties.set(ctx, data[i])
    ctx.stroke()

  ctx.restore()


exports.quad = quad