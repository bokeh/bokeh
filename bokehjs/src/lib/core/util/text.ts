import {div, span, offset} from "../dom"

const _font_cache: Map<string, FontMetrics> = new Map()

export type FontMetrics = {
  height: number
  ascent: number
  descent: number
}

export function measure_font(font: string): FontMetrics {
  const metrics = _font_cache.get(font)
  if (metrics != null)
    return metrics

  const text = span({style: {font}}, "Hg")
  const block = div({style: {display: "inline-block", width: "1px", height: "0px"}})

  const elem = div({class: "bk-root"}, text, block)
  document.body.appendChild(elem)

  try {
    block.style.verticalAlign = "baseline"
    const ascent = offset(block).top - offset(text).top

    block.style.verticalAlign = "bottom"
    const height = offset(block).top - offset(text).top

    const result = {height, ascent, descent: height - ascent}
    _font_cache.set(font, result)

    return result
  } finally {
    document.body.removeChild(elem)
  }
}

const metrics_text = "ÅŚg|"

export function native_font_metrics(font: string): FontMetrics {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!

  ctx.font = font
  const metrics = ctx.measureText(metrics_text)

  const ascent = metrics.actualBoundingBoxAscent
  const descent = metrics.actualBoundingBoxDescent

  return {height: ascent + descent, ascent, descent}
}

function _font_metrics(font: string): FontMetrics {
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

const _metrics_cache: Map<string, FontMetrics> = new Map()

export function font_metrics(font: string): FontMetrics {
  let metrics = _metrics_cache.get(font)
  if (metrics == null) {
    metrics = _font_metrics(font)
    _metrics_cache.set(font, metrics)
  }
  return metrics
}
