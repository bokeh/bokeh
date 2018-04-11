import {div, span, offset} from "../dom"

const cache: {[key: string]: TextMetrics} = {}

export interface TextMetrics {
  height: number
  ascent: number
  descent: number
}

export function get_text_height(font: string): TextMetrics {
  if (cache[font] != null)
    return cache[font]

  const text = span({style: {font: font}}, "Hg")
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
