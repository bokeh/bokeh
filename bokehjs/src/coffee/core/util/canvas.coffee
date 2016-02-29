
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
    ctx.imageSmoothingEnabled = value;
    ctx.mozImageSmoothingEnabled = value;
    ctx.oImageSmoothingEnabled = value;
    ctx.webkitImageSmoothingEnabled = value;
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

get_scale_ratio = (ctx, hidpi) ->
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

module.exports =
  fixup_image_smoothing: fixup_image_smoothing
  fixup_line_dash: fixup_line_dash
  fixup_line_dash_offset: fixup_line_dash_offset
  fixup_measure_text: fixup_measure_text
  get_scale_ratio: get_scale_ratio