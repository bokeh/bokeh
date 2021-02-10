import {settings} from "../settings"
import {is_windows} from "./platform"

export type FontMetrics = {
  height: number
  ascent: number
  descent: number
  cap_height: number
}

const _font_metrics = (() => {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!
  let cwidth = -1
  let cheight = -1

  return (font: string): FontMetrics => {
    ctx.font = font
    const {width: em} = ctx.measureText("M")

    const width = Math.ceil(em)
    const height = Math.ceil(2.0*em)
    const baseline = Math.ceil(1.5*em)

    if (cwidth < width) {
      cwidth = width
      canvas.width = width
    }
    if (cheight < height) {
      cheight = height
      canvas.height = height
    }

    ctx.fillStyle = "#f00"
    ctx.fillRect(0, 0, width, height)

    const measure_ascent = (data: Uint8ClampedArray) => {
      let k = 0
      for (let i = 0; i <= baseline; i++) {
        for (let j = 0; j < width; j++, k += 4)
          if (data[k] != 255)
            return baseline - i
      }
      return 0
    }

    const measure_descent = (data: Uint8ClampedArray) => {
      let k = data.length - 4
      for (let i = height; i >= baseline; i--) {
        for (let j = 0; j < width; j++, k -= 4)
          if (data[k] != 255)
            return i - baseline
      }
      return 0
    }

    ctx.font = font
    ctx.fillStyle = "#000"

    for (const c of "ASQ") {
      ctx.fillText(c, 0, baseline)
    }

    const {data: data0} = ctx.getImageData(0, 0, width, height)
    const cap_height = measure_ascent(data0)

    for (const c of "ÅŚgy") {
      ctx.fillText(c, 0, baseline)
    }

    const {data: data1} = ctx.getImageData(0, 0, width, height)
    const ascent = measure_ascent(data1)
    const descent = measure_descent(data1)

    return {height: ascent + descent, ascent, cap_height, descent}
  }
})()

function _adjust_metrics(font: string, metrics: FontMetrics): void {
  // Override normal 11px Bokeh (Roboto) font in tests, so that baselines
  // match across platforms. In future will need to provide baselines per
  // platform.
  if (settings.dev && is_windows) {
    if (font.includes("Bokeh") && font.includes("11px")) {
      metrics.height += 1
      metrics.descent += 1
    }
  }
}

const _metrics_cache: Map<string, FontMetrics> = new Map()

export function font_metrics(font: string): FontMetrics {
  let metrics = _metrics_cache.get(font)
  if (metrics == null) {
    metrics = _font_metrics(font)
    _adjust_metrics(font, metrics)
    _metrics_cache.set(font, metrics)
  }
  return metrics
}
