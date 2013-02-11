
glyph = require("../glyph")


Glyph = glyph.Glyph
line_properties = glyph.line_properties
fill_properties = glyph.fill_properties


rect = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["x", "y", "width", "height", "angle"], [fill_properties, line_properties])

  x = (glyph.select("x", obj) for obj in data)
  y = (glyph.select("y", obj) for obj in data)
  [sx, sy] = view.map_to_screen(x, glyph.x.units, y, glyph.y.units)
  sw = view.distance(glyph, data, "x", "width", "center")
  sh = view.distance(glyph, data, "y", "height", "center")
  angle = (glyph.select("angle", obj) for obj in data) # TODO deg/rad

  do_fill = glyph.fill_properties.do_fill
  do_stroke = glyph.line_properties.do_stroke

  if glyph.fast_path
    if do_fill
      glyph.fill_properties.set(ctx, glyph)
      ctx.beginPath()
      for i in [0..sx.length-1]
        if isNaN(sx[i] + sy[i] + sw[i] + sh[i] + angle[i])
          continue

        if angle[i]
          ctx.translate(sx[i], sy[i])
          ctx.rotate(angle[i])
          ctx.rect(-sw[i]/2, -sh[i]/2, sw[i], sh[i])
          ctx.rotate(-angle[i])
          ctx.translate(-sx[i], -sy[i])
        else
          ctx.rect(sx[i]-sw[i]/2, sy[i]-sh[i]/2, sw[i], sh[i])

    ctx.fill()

    if do_stroke
      glyph.line_properties.set(ctx, glyph)
      ctx.beginPath()
      for i in [0..sx.length-1]
        if isNaN(sx[i] + sy[i] + sw[i] + sh[i] + angle[i])
          continue

        if angle[i]
          ctx.translate(sx[i], sy[i])
          ctx.rotate(angle[i])
          ctx.rect(-sw[i]/2, -sh[i]/2, sw[i], sh[i])
          ctx.rotate(-angle[i])
          ctx.translate(-sx[i], -sy[i])
        else
          ctx.rect(sx[i]-sw[i]/2, sy[i]-sh[i]/2, sw[i], sh[i])

      ctx.stroke()

  else
    for i in [0..sx.length-1]
      if isNaN(sx[i] + sy[i] + sw[i] + sh[i] + angle[i])
        continue

      ctx.translate(sx[i], sy[i])
      ctx.rotate(angle[i])

      ctx.beginPath()
      ctx.rect(-sw[i]/2, -sh[i]/2, sw[i], sh[i])

      if do_fill
        glyph.fill_properties.set(ctx, data[i])
        ctx.fill()

      if do_stroke
        glyph.line_properties.set(ctx, data[i])
        ctx.stroke()

      ctx.rotate(-angle[i])
      ctx.translate(-sx[i], -sy[i])

  ctx.restore()


exports.rect = rect