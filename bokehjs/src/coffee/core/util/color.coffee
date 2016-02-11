# Used by webgl to convert colors to rgba tuples.

svg_colors = require "./svg_colors"

_component2hex = (v) ->
  h = Number(v).toString(16)
  h = if h.length == 1 then '0' + h else h

color2hex = (color) ->
  color = color + ''
  if color.indexOf('#') == 0
    return color
  else if svg_colors[color]?
    return svg_colors[color]
  else if color.indexOf('rgb') == 0
    rgb = color.match(/\d+/g)
    hex = (_component2hex(v) for v in rgb).join('')
    return '#' + hex.slice(0, 8)  # can also be rgba
  else
    return color

color2rgba = (color, alpha=1) ->
    if not color  # NaN, null, '', etc.
      return [0, 0, 0, 0]  # transparent
    # Convert to hex and then to clean version of 6 or 8 chars
    hex = color2hex(color)
    hex = hex.replace(/ |#/g, '')
    if hex.length <= 4
      hex = hex.replace(/(.)/g, '$1$1')
    # Convert pairs to numbers
    hex = hex.match(/../g)
    rgba = (parseInt(i, 16)/255 for i in hex)
    # Ensure correct length, add alpha if necessary
    while rgba.length < 3
      rgba.push(0)
    if rgba.length < 4
      rgba.push(alpha)
    return rgba.slice(0, 4)  # return 4 elements

module.exports =
  color2hex: color2hex
  color2rgba: color2rgba
