import {unreachable} from "./assert"
import {is_defined} from "./types"

type char = string

export type BoxMetrics = {
  width: number
  height: number
  ascent: number
  descent: number
}

export type FontMetrics = {
  height: number
  ascent: number
  descent: number
  cap_height: number
  x_height: number
}

const has_OffscreenCanvas = (() => {
  try {
    return typeof OffscreenCanvas !== "undefined" && new OffscreenCanvas(0, 0).getContext("2d") != null
  } catch {
    return false
  }
})()

const _offscreen_canvas = (() => {
  if (has_OffscreenCanvas)
    return (w: number, h: number) => new OffscreenCanvas(w, h)
  else {
    return (w: number, h: number) => {
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      return canvas
    }
  }
})()

const _native_font_metrics = (() => {
  const canvas = _offscreen_canvas(0, 0)
  const ctx = canvas.getContext("2d")!

  return (font: string): FontMetrics => {
    ctx.font = font

    const cap_metrics = ctx.measureText("M")
    const x_metrics = ctx.measureText("x")
    const metrics = ctx.measureText("ÅŚg|")

    const font_ascent = metrics.fontBoundingBoxAscent
    const font_descent = metrics.fontBoundingBoxDescent

    if (is_defined(font_ascent) && is_defined(font_descent)) {
      return {
        height: font_ascent + font_descent,
        ascent: font_ascent,
        descent: font_descent,
        cap_height: cap_metrics.actualBoundingBoxAscent,
        x_height: x_metrics.actualBoundingBoxAscent,
      }
    }

    const text_ascent = metrics.actualBoundingBoxAscent
    const text_descent = metrics.actualBoundingBoxDescent

    if (is_defined(text_ascent) && is_defined(text_descent)) {
      return {
        height: text_ascent + text_descent,
        ascent: text_ascent,
        descent: text_descent,
        cap_height: cap_metrics.actualBoundingBoxAscent,
        x_height: x_metrics.actualBoundingBoxAscent,
      }
    }

    unreachable()
  }
})()

const _native_glyph_metrics = (() => {
  const canvas = _offscreen_canvas(0, 0)
  const ctx = canvas.getContext("2d")!

  return (glyph: char, font: string): BoxMetrics => {
    ctx.font = font
    const metrics = ctx.measureText(glyph)

    const glyph_ascent = metrics.actualBoundingBoxAscent
    const glyph_descent = metrics.actualBoundingBoxDescent

    if (is_defined(glyph_ascent) && is_defined(glyph_descent)) {
      return {
        width: metrics.width,
        height: glyph_ascent + glyph_descent,
        ascent: glyph_ascent,
        descent: glyph_descent,
      }
    }

    unreachable()
  }
})()

const _internal_font_metrics = (() => {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!

  let cwidth = -1
  let cheight = -1

  return (font: string, scale: number = 1): FontMetrics => {
    ctx.font = font
    const {width: _em} = ctx.measureText("M")
    const em = _em*scale

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

    ctx.save()
    ctx.scale(scale, scale)

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

    for (const c of "xa") {
      ctx.fillText(c, 0, baseline/scale)
    }

    const {data: data0} = ctx.getImageData(0, 0, width, height)
    const x_height = measure_ascent(data0)/scale

    for (const c of "ASQ") {
      ctx.fillText(c, 0, baseline/scale)
    }

    const {data: data1} = ctx.getImageData(0, 0, width, height)
    const cap_height = measure_ascent(data1)/scale

    for (const c of "ÅŚgy") {
      ctx.fillText(c, 0, baseline/scale)
    }

    const {data: data2} = ctx.getImageData(0, 0, width, height)
    const ascent = measure_ascent(data2)/scale
    const descent = measure_descent(data2)/scale

    ctx.restore()

    return {height: ascent + descent, ascent, cap_height, x_height, descent}
  }
})()

const _internal_glyph_metrics = (() => {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!

  let cwidth = -1
  let cheight = -1

  return (glyph: char, font: string, scale: number = 1): BoxMetrics => {
    ctx.font = font
    const {width: _em} = ctx.measureText("M")
    const em = _em*scale

    const width = Math.ceil(em)
    const height = Math.ceil(2.0*em)
    const baseline = Math.ceil(1.5*em)

    if (cwidth < width || cheight < height) {
      cwidth = width
      canvas.width = width
      cheight = height
      canvas.height = height
    }

    ctx.save()
    ctx.scale(scale, scale)

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

    ctx.fillText(glyph, 0, baseline/scale)
    const size = ctx.measureText(glyph)

    const {data} = ctx.getImageData(0, 0, width, height)
    const ascent = measure_ascent(data)/scale
    const descent = measure_descent(data)/scale

    ctx.restore()

    return {width: size.width, height: ascent + descent, ascent, descent}
  }
})()

const _font_metrics = (() => {
  try {
    _native_font_metrics("normal 10px sans-serif")
    return _native_font_metrics
  } catch {
    return _internal_font_metrics
  }
})()

const _glyph_metrics = (() => {
  try {
    _native_glyph_metrics("A", "normal 10px sans-serif")
    return _native_glyph_metrics
  } catch {
    return _internal_glyph_metrics
  }
})()

const _metrics_cache: Map<string, {font: FontMetrics, glyphs: Map<char, BoxMetrics>}> = new Map()

export function font_metrics(font: string): FontMetrics {
  let metrics = _metrics_cache.get(font)
  if (metrics == null) {
    // TODO: document.fonts.check(font)
    metrics = {font: _font_metrics(font), glyphs: new Map()}
    _metrics_cache.set(font, metrics)
  }
  return metrics.font
}

export function glyph_metrics(glyph: char, font: string): BoxMetrics {
  let metrics = _metrics_cache.get(font)
  if (metrics == null) {
    font_metrics(font)
    metrics = _metrics_cache.get(font)!
  }

  let glyph_metrics = metrics.glyphs.get(glyph)
  if (glyph_metrics == null) {
    glyph_metrics = _glyph_metrics(glyph, font)
    metrics.glyphs.set(glyph, glyph_metrics)
  }

  return glyph_metrics
}

export function parse_css_font_size(size: string): {value: number, unit: string} | null {
  const match = size.match(/^\s*(\d+(\.\d+)?)(\w+)\s*$/)
  if (match != null) {
    const [, value,, unit] = match
    const number = Number(value)
    if (isFinite(number))
      return {value: number, unit}
  }
  return null
}

export function parse_css_length(size: string): {value: number, unit: string} | null {
  const match = size.match(/^\s*(-?\d+(\.\d+)?)(\w+)\s*$/)
  if (match != null) {
    const [, value,, unit] = match
    const number = Number(value)
    if (isFinite(number))
      return {value: number, unit}
  }
  return null
}
