export type FontMetrics = {
  height: number
  ascent: number
  descent: number
}

const metrics_text = "ÅŚg|"

function _native_font_metrics(font: string): FontMetrics {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!

  ctx.font = font
  const metrics = ctx.measureText(metrics_text)

  const font_ascent = metrics.fontBoundingBoxAscent
  const font_descent = metrics.fontBoundingBoxDescent

  if (font_ascent != null && font_descent != null) {
    return {height: font_ascent + font_descent, ascent: font_ascent, descent: font_descent}
  }

  const text_ascent = metrics.actualBoundingBoxAscent
  const text_descent = metrics.actualBoundingBoxDescent

  if (text_ascent != null && text_descent != null) {
    return {height: text_ascent + text_descent, ascent: text_ascent, descent: text_descent}
  }

  throw new Error("can't compute native font metrics")
}

function _internal_font_metrics(font: string): FontMetrics {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!

  ctx.font = font
  const {width: base} = ctx.measureText(metrics_text[0])

  const width = Math.ceil(base)
  const height = Math.ceil(2.0*base)
  const baseline = Math.ceil(1.5*base)

  canvas.width = width
  canvas.height = height

  ctx.fillStyle = "#f00"
  ctx.fillRect(0, 0, width, height)

  ctx.font = font
  ctx.fillStyle = "#000"
  for (const c of metrics_text) {
    ctx.fillText(c, 0, baseline)
  }

  const {data} = ctx.getImageData(0, 0, width, height)

  const ascent = (() => {
    let k = 0
    for (let i = 0; i <= baseline; i++) {
      for (let j = 0; j < width; j++, k += 4)
        if (data[k] != 255)
          return baseline - i
    }
    return 0
  })()

  const descent = (() => {
    let k = data.length - 4
    for (let i = height; i >= baseline; i--) {
      for (let j = 0; j < width; j++, k -= 4)
        if (data[k] != 255)
          return i - baseline
    }
    return 0
  })()

  return {height: ascent + descent, ascent, descent}
}

const _font_metrics = (() => {
  try {
    _native_font_metrics("normal 10px sans-serif")
    return _native_font_metrics
  } catch {
    return _internal_font_metrics
  }
})()

const _metrics_cache: Map<string, FontMetrics> = new Map()

export function font_metrics(font: string): FontMetrics {
  let metrics = _metrics_cache.get(font)
  if (metrics == null) {
    // TODO: document.fonts.check(font)
    metrics = _font_metrics(font)
    _metrics_cache.set(font, metrics)
  }
  return metrics
}
