import {assert} from "./assert"
import {canvas} from "../dom"

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

const _offscreen_context = (() => {
  // Support Firefox ESR, etc., see https://github.com/bokeh/bokeh/issues/14006.
  const canvas_el = typeof OffscreenCanvas !== "undefined" ?  new OffscreenCanvas(0, 0) : canvas({width: 0, height: 0})
  const ctx = canvas_el.getContext("2d")
  assert(ctx != null, "can't obtain 2d context")
  return ctx
})()

function _font_metrics(font: string): FontMetrics {
  const ctx = _offscreen_context
  ctx.font = font

  const cap_metrics = ctx.measureText("M")
  const x_metrics = ctx.measureText("x")
  const metrics = ctx.measureText("ÅŚg|")

  // Support Firefox ESR, etc., see https://github.com/bokeh/bokeh/issues/13969.
  const ascent = typeof metrics.fontBoundingBoxAscent !== "undefined" ? metrics.fontBoundingBoxAscent : metrics.actualBoundingBoxAscent
  const descent = typeof metrics.fontBoundingBoxDescent !== "undefined" ? metrics.fontBoundingBoxDescent : metrics.actualBoundingBoxDescent

  return {
    height: ascent + descent,
    ascent,
    descent,
    cap_height: cap_metrics.actualBoundingBoxAscent,
    x_height: x_metrics.actualBoundingBoxAscent,
  }
}

const _metrics_cache: Map<string, {font: FontMetrics}> = new Map()

export function font_metrics(font: string): FontMetrics {
  let metrics = _metrics_cache.get(font)
  if (metrics == null) {
    const loaded = document.fonts.check(font)
    metrics = {font: _font_metrics(font)}
    if (loaded) {
      _metrics_cache.set(font, metrics)
    }
  }
  return metrics.font
}

export function parse_css_font_size(size: string): {value: number, unit: string} | null {
  const match = size.match(/^\s*(\d+(\.\d+)?)(\w+)\s*$/)
  if (match != null) {
    const [, value,, unit] = match
    const number = Number(value)
    if (isFinite(number)) {
      return {value: number, unit}
    }
  }
  return null
}

export function parse_css_length(size: string): {value: number, unit: string} | null {
  const match = size.match(/^\s*(-?\d+(\.\d+)?)(\w+)\s*$/)
  if (match != null) {
    const [, value,, unit] = match
    const number = Number(value)
    if (isFinite(number)) {
      return {value: number, unit}
    }
  }
  return null
}
