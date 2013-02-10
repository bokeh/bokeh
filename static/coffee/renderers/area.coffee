
glyph = require("../glyph")


Glyph = glyph.Glyph
line_properties = glyph.line_properties
fill_properties = glyph.fill_properties


area = (view, glyphspec, data) ->
  ctx = view.plot_view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["xs", "ys"], [fill_properties, line_properties])

  for pt in data
    x = glyph.select("xs", pt)
    y = glyph.select("ys", pt)

    [sx, sy] = view.map_to_screen2(x, x.units, y, y.units)

    glyph.fill_properties.set(ctx, pt)
    for i in [0..sx.length-1]
      if i == 0
        ctx.beginPath()
        ctx.moveTo(sx[i], sy[i])
        continue
      else if isNaN(sx[i]) or isNaN(sy[i])
        ctx.closePath()
        ctx.fill()
        ctx.beginPath()
        continue
      else
        ctx.lineTo(sx[i], sy[i])
    ctx.closePath()
    ctx.fill()

    glyph.line_properties.set(ctx, pt)
    for i in [0..sx.length-1]
      if i == 0
        ctx.beginPath()
        ctx.moveTo(sx[i], sy[i])
        continue
      else if isNaN(sx[i]) or isNaN(sy[i])
        ctx.closePath()
        ctx.stroke()
        ctx.beginPath()
        continue
      else
        ctx.lineTo(sx[i], sy[i])
    ctx.closePath()
    ctx.stroke()

  ctx.restore()


exports.area = area
