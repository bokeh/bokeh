import {Size} from "../types"
import {div, span, offset} from "../dom"

const _font_cache: Map<string, FontMetrics> = new Map()

export interface FontMetrics {
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

  const elem = div({}, text, block)
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

const _text_cache: Map<string, Map<string, Size>> = new Map()

export function measure_text(text: string, font: string): Size {
  let size_cache = _text_cache.get(font)
  if (size_cache != null) {
    const size = size_cache.get(text)
    if (size != null)
      return size
  } else {
    size_cache = new Map()
    _text_cache.set(font, size_cache)
  }

  const el = div({style: {display: "inline-block", "white-space": "nowrap", font}}, text)
  document.body.appendChild(el)

  try {
    const {width, height} = el.getBoundingClientRect()
    size_cache.set(text, {width, height})
    return {width, height}
  } finally {
    document.body.removeChild(el)
  }
}
