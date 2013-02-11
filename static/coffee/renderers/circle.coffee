
glyph = require("../glyph")


Glyph = glyph.Glyph
line_properties = glyph.line_properties
fill_properties = glyph.fill_properties


circle = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()
  glyph = new Glyph(view, glyphspec, ["x", "y", "radius"], [fill_properties, line_properties])

  x = (glyph.select("x", obj) for obj in data)
  y = (glyph.select("y", obj) for obj in data)
  [sx, sy] = view.map_to_screen(x, glyph.x.units, y, glyph.y.units)
  radius = view.distance(glyph, data, "x", "radius", "edge")

  do_fill = glyph.fill_properties.do_fill
  do_stroke = glyph.line_properties.do_stroke

  if glyph.fast_path
    if do_fill
      glyph.fill_properties.set(ctx, glyph)
      for i in [0..sx.length-1]
        if isNaN(sx[i] + sy[i] + radius[i])
          continue
        ctx.beginPath()
        ctx.arc(sx[i], sy[i], radius[i], 0, 2*Math.PI*2, false)
        ctx.fill()

    if do_stroke
      glyph.line_properties.set(ctx, glyph)
      for i in [0..sx.length-1]
        if isNaN(sx[i] + sy[i] + radius[i])
          continue
        ctx.beginPath()
        ctx.arc(sx[i], sy[i], radius[i], 0, 2*Math.PI*2, false)
        ctx.stroke()

  else
    for i in [0..sx.length-1]
      if isNaN(sx[i] + sy[i] + radius[i])
        continue

      ctx.beginPath()
      ctx.arc(sx[i], sy[i], radius[i], 0, 2*Math.PI*2, false)

      if do_fill
        glyph.fill_properties.set(ctx, data[i])
        ctx.fill()

      if do_stroke
        glyph.line_properties.set(ctx, data[i])
        ctx.stroke()

  ctx.restore()



exports.circle = circle
