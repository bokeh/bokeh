import {Size} from "../types"
import {div, span, offset} from "../dom"

const cache: {[key: string]: FontMetrics} = {}

export interface FontMetrics {
  height: number
  ascent: number
  descent: number
}

export function measure_font(font: string): FontMetrics {
  if (cache[font] != null)
    return cache[font]

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
    cache[font] = result

    return result
  } finally {
    document.body.removeChild(elem)
  }
}

const _cache: {[key: string]: {[key: string]: Size}} = {}

export function measure_text(text: string, font: string): Size {
  const text_cache = _cache[font]
  if (text_cache != null) {
    const size = text_cache[text]
    if (size != null)
      return size
  } else
    _cache[font] = {}

  const el = div({style: {display: "inline-block", "white-space": "nowrap", font}}, text)
  document.body.appendChild(el)

  try {
    const {width, height} = el.getBoundingClientRect()
    _cache[font][text] = {width, height}
    return {width, height}
  } finally {
    document.body.removeChild(el)
  }
}
