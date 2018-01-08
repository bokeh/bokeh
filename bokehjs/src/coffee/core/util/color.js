import * as svg_colors from "./svg_colors"

_component2hex = (v) ->
  h = Number(v).toString(16)
  h = if h.length == 1 then '0' + h else h

export color2hex = (color) ->
  color = color + ''
  if color.indexOf('#') == 0
    return color
  else if svg_colors[color]?
    return svg_colors[color]
  else if color.indexOf('rgb') == 0
    rgb = color.replace(/^rgba?\(|\s+|\)$/g,'').split(',')
    hex = (_component2hex(v) for v in rgb.slice(0, 3)).join('')
    if rgb.length == 4
      hex = hex + _component2hex(Math.floor(parseFloat(rgb.slice(3)) * 255))
    hex_string = '#' + hex.slice(0, 8)  # can also be rgba
    return hex_string
  else
    return color

export color2rgba = (color, alpha=1) ->
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

export valid_rgb = (value) ->
  switch value.substring(0, 4)
      when "rgba" then params = {start: "rgba(", len: 4, alpha: true}
      when "rgb(" then params = {start: "rgb(", len: 3, alpha: false}
      else return false

  # if '.' and then ',' found, we know decimals are used on rgb
  if new RegExp(".*?(\\.).*(,)").test(value)
    throw new Error("color expects integers for rgb in rgb/rgba tuple, received #{value}")

  # extract the numerical values from inside parens
  contents = value.replace(params.start, "").replace(")", "").split(',').map(parseFloat)

  # check length of array based on rgb/rgba
  if contents.length != params.len
    throw new Error("color expects rgba #{expect_len}-tuple, received #{value}")

  # check for valid numerical values for rgba
  if params.alpha and !(0 <= contents[3] <= 1)
    throw new Error("color expects rgba 4-tuple to have alpha value between 0 and 1")
  if false in (0 <= rgb <= 255 for rgb in contents.slice(0, 3))
    throw new Error("color expects rgb to have value between 0 and 255")
  return true
