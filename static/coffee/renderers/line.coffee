
glyph = require("../glyph")


Glyph = glyph.Glyph
line_properties = glyph.line_properties


line = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["xs", "ys"], [line_properties])

  if glyph.fast_path
    glyph.line_properties.set(ctx, glyph)
    for pt in data
      x = glyph.select("xs", pt)
      y = glyph.select("ys", pt)

      [sx, sy] = view.map_to_screen(x, glyph.xs.units, y, glyph.ys.units)

      for i in [0..sx.length-1]
        if i == 0
          ctx.beginPath()
          ctx.moveTo(sx[i], sy[i])
          continue
        else if isNaN(sx[i]) or isNaN(sy[i])
          ctx.stroke()
          ctx.beginPath()
          continue
        else
          ctx.lineTo(sx[i], sy[i])
      ctx.stroke()

  else
    for pt in data
      x = glyph.select("xs", pt)
      y = glyph.select("ys", pt)

      [sx, sy] = view.map_to_screen(x, glyph.xs.units, y, glyph.ys.units)

      glyph.line_properties.set(ctx, pt)
      for i in [0..sx.length-1]
        if i == 0
          ctx.beginPath()
          ctx.moveTo(sx[i], sy[i])
          continue
        else if isNaN(sx[i]) or isNaN(sy[i])
          ctx.stroke()
          ctx.beginPath()
          continue
        else
          ctx.lineTo(sx[i], sy[i])
      ctx.stroke()

  ctx.restore()


exports.line = line
