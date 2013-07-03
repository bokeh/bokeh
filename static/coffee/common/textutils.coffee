

getTextHeight = (font) ->

  text = $('<span>Hg</span>').css({ font: font })
  block = $('<div style="display: inline-block; width: 1px; height: 0px;"></div>')

  div = $('<div></div>')
  div.append(text, block)

  body = $('body')
  body.append(div)

  try
    result = {}

    block.css({ verticalAlign: 'baseline' })
    result.ascent = block.offset().top - text.offset().top

    block.css({ verticalAlign: 'bottom' })
    result.height = block.offset().top - text.offset().top

    result.descent = result.height - result.ascent
  finally
    div.remove()

  return result


exports.getTextHeight = getTextHeight