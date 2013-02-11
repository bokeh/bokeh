
glyph = require("../glyph")


Glyph = glyph.Glyph
line_properties = glyph.line_properties
fill_properties = glyph.fill_properties


quad = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["left", "right", "bottom", "top"], [fill_properties, line_properties])

  left = (glyph.select("left", obj) for obj in data)
  top  = (glyph.select("top", obj) for obj in data)
  [sx0, sy0] = view.map_to_screen(left, glyph.left.units, top, glyph.top.units)

  right  = (glyph.select("right", obj) for obj in data)
  bottom = (glyph.select("bottom", obj) for obj in data)
  [sx1, sy1] = view.map_to_screen(right, glyph.right.units, bottom, glyph.bottom.units)

  do_fill = glyph.fill_properties.do_fill
  do_stroke = glyph.line_properties.do_stroke

  if glyph.fast_path
    if do_fill
      glyph.fill_properties.set(ctx, glyph)
      ctx.beginPath()
      for i in [0..sx0.length-1]
        if isNaN(sx0[i] + sy0[i] + sx1[i] + sy1[i])
          continue
        ctx.rect(sx0[i], sy0[i], sx1[i]-sx0[i], sy1[i]-sy0[i])
      ctx.fill()

    if do_stroke
      glyph.line_properties.set(ctx, glyph)
      ctx.beginPath()
      for i in [0..sx0.length-1]
        if isNaN(sx0[i] + sy0[i] + sx1[i] + sy1[i])
          continue
        ctx.rect(sx0[i], sy0[i], sx1[i]-sx0[i], sy1[i]-sy0[i])
      ctx.stroke()

  else
    for i in [0..sx0.length-1]
      if isNaN(sx0[i] + sy0[i] + sx1[i] + sy1[i])
        continue

      ctx.beginPath()
      ctx.rect(sx0[i], sy0[i], sx1[i]-sx0[i], sy1[i]-sy0[i])

      if do_fill
        glyph.fill_properties.set(ctx, data[i])
        ctx.fill()

      if do_stroke
        glyph.line_properties.set(ctx, data[i])
        ctx.stroke()

  ctx.restore()


exports.quad = quad