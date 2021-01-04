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
