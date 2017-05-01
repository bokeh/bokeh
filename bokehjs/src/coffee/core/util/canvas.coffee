fixup_line_dash = (ctx) ->
  if (!ctx.setLineDash)
    ctx.setLineDash = (dash) ->
      ctx.mozDash = dash
      ctx.webkitLineDash = dash
  if (!ctx.getLineDash)
    ctx.getLineDash = () ->
      return ctx.mozDash

fixup_line_dash_offset = (ctx) ->
  ctx.setLineDashOffset = (dash_offset) ->
    ctx.lineDashOffset = dash_offset
    ctx.mozDashOffset = dash_offset
    ctx.webkitLineDashOffset = dash_offset
  ctx.getLineDashOffset = () ->
    return ctx.mozDashOffset

fixup_image_smoothing = (ctx) ->
  ctx.setImageSmoothingEnabled = (value) ->
    ctx.imageSmoothingEnabled = value
    ctx.mozImageSmoothingEnabled = value
    ctx.oImageSmoothingEnabled = value
    ctx.webkitImageSmoothingEnabled = value
  ctx.getImageSmoothingEnabled = () ->
    return ctx.imageSmoothingEnabled ? true

fixup_measure_text = (ctx) ->
  if ctx.measureText and not ctx.html5MeasureText?
    ctx.html5MeasureText = ctx.measureText

    ctx.measureText = (text) ->
      textMetrics = ctx.html5MeasureText(text)
      # fake it til you make it
      textMetrics.ascent = ctx.html5MeasureText("m").width * 1.6
      return textMetrics

fixup_ellipse = (ctx) ->
  # implementing the ctx.ellipse function with bezier curves
  # we don't implement the startAngle, endAngle and anticlockwise arguments.
  ellipse_bezier = (x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise = false) ->
    c = 0.551784 # see http://www.tinaja.com/glib/ellipse4.pdf

    ctx.translate(x, y)
    ctx.rotate(rotation)

    rx = radiusX
    ry = radiusY
    if anticlockwise
      rx = -radiusX
      ry = -radiusY

    ctx.moveTo(-rx, 0) # start point of first curve
    ctx.bezierCurveTo(-rx,  ry * c, -rx * c,  ry, 0,  ry)
    ctx.bezierCurveTo( rx * c,  ry,  rx,  ry * c,  rx, 0)
    ctx.bezierCurveTo( rx, -ry * c,  rx * c, -ry, 0, -ry)
    ctx.bezierCurveTo(-rx * c, -ry, -rx, -ry * c, -rx, 0)

    ctx.rotate(-rotation)
    ctx.translate(-x, -y)
    return

  if (!ctx.ellipse)
    ctx.ellipse = ellipse_bezier

export fixup_ctx = (ctx) ->
  fixup_line_dash(ctx)
  fixup_line_dash_offset(ctx)
  fixup_image_smoothing(ctx)
  fixup_measure_text(ctx)
  fixup_ellipse(ctx)

export get_scale_ratio = (ctx, hidpi) ->
  if hidpi
    devicePixelRatio = window.devicePixelRatio || 1
    backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                        ctx.mozBackingStorePixelRatio ||
                        ctx.msBackingStorePixelRatio ||
                        ctx.oBackingStorePixelRatio ||
                        ctx.backingStorePixelRatio || 1
    return devicePixelRatio / backingStoreRatio
  else
    return 1
