import {div, span, offset} from "../dom"

cache = {}

export get_text_height = (font) ->
  if cache[font]?
    return cache[font]

  text = span({style: { font: font }}, "Hg")
  block = div({style: { display: "inline-block", width: "1px", height: "0px" }})

  elem = div({}, text, block)
  document.body.appendChild(elem)

  try
    result = {}

    block.style.verticalAlign = "baseline"
    result.ascent = offset(block).top - offset(text).top

    block.style.verticalAlign = "bottom"
    result.height = offset(block).top - offset(text).top

    result.descent = result.height - result.ascent
  finally
    document.body.removeChild(elem)

  cache[font] = result
  return result
