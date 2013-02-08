
glyph = require("../glyph")


Glyph = glyph.Glyph
line_properties = glyph.line_properties
fill_properties = glyph.fill_properties


oval = (view, glyphspec, data) ->
  ctx = view.ctx

  ctx.save()

  glyph = new Glyph(view, glyphspec, ["x", "y", "width", "height", "angle", "direction"], [fill_properties, line_properties])

  [sx, sy] = view.map_to_screen(glyph, data)
  sw = view.distance(glyph, data, "x", "width", "center")
  sh = view.distance(glyph, data, "y", "height", "center")
  angle = (glyph.select("angle", obj) if glyph.angle_units == "radians" else glyph.select("angle", obj) * 2 * Math.PI / 360.0 for obj in data)
  #direction = (true if glyph.select("direction", obj) == "clockwise" else false for obj in data)

  for i in [0..sx.length-1]

    if isNaN(sx[i] + sy[i] + sw[i] + sh[i] + angle[i])
      continue

    # need an extra save and restore inside the loop to undo the scaling correctly
    ctx.save()

    ctx.translate(sx[i], sy[i])
    ctx.scale(sw[i], sh[i])
    ctx.rotate(angle[i])

    ctx.beginPath()
    ctx.arc(0, 0, 1, 0, 2*Math.PI, direction[i]);

    glyph.fill_properties.set(ctx, data[i])
    ctx.fill()

    glyph.line_properties.set(ctx, data[i])
    ctx.stroke()

    ctx.restore

  ctx.restore()


exports.oval = oval