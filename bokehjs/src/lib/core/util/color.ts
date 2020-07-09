import {svg_colors, is_svg_color} from "./svg_colors"
import {includes} from "./array"

export function is_color(value: string): boolean {
  return is_svg_color(value.toLowerCase()) || value.substring(0, 1) == "#" || valid_rgb(value)
}

function _component2hex(v: number | string): string {
  const h = Number(v).toString(16)
  return h.length == 1 ? `0${h}` : h
}

export function rgb2hex(r: number, g: number, b: number): string {
  const R = _component2hex(r & 0xFF)
  const G = _component2hex(g & 0xFF)
  const B = _component2hex(b & 0xFF)
  return `#${R}${G}${B}`
}

export function color2hex(color: string): string {
  color = color + ''
  if (color.indexOf('#') == 0)
    return color
  else if (is_svg_color(color))
    return svg_colors[color]
  else if (color.indexOf('rgb') == 0) {
    const rgb = color.replace(/^rgba?\(|\s+|\)$/g, '').split(',')
    let hex = rgb.slice(0, 3).map(_component2hex).join('')
    if (rgb.length == 4)
      hex += _component2hex(Math.floor(parseFloat(rgb[3]) * 255))
    return `#${hex.slice(0, 8)}`  // can also be rgba
  } else
    return color
}

// each component is in [0, 1] range
export type RGBA = [number, number, number, number]

export function encode_rgba([r, g, b, a]: RGBA): number {
  return (r*255 | 0) << 24 | (g*255 | 0) << 16 | (b*255 | 0) << 8 | (a*255 | 0)
}

export function decode_rgba(rgba: number): RGBA {
  const r = ((rgba >> 24) & 0xff) / 255
  const g = ((rgba >> 16) & 0xff) / 255
  const b = ((rgba >>  8) & 0xff) / 255
  const a = ((rgba >>  0) & 0xff) / 255
  return [r, g, b, a]
}

export function color2rgba(color: string | null, alpha: number = 1.0): RGBA {
  if (!color)  // NaN, null, '', etc.
    return [0, 0, 0, 0]  // transparent
  // Convert to hex and then to clean version of 6 or 8 chars
  let hex = color2hex(color)
  hex = hex.replace(/ |#/g, '')
  if (hex.length <= 4) {
    hex = hex.replace(/(.)/g, '$1$1')
  }
  // Convert pairs to numbers
  const rgba = hex.match(/../g)!.map((i) => parseInt(i, 16)/255)
  // Ensure correct length, add alpha if necessary
  while (rgba.length < 3)
    rgba.push(0)
  if (rgba.length < 4)
    rgba.push(alpha)
  return rgba.slice(0, 4) as RGBA
}

export function valid_rgb(value: string): boolean {
  let params: {start: string, len: number, alpha: boolean}
  switch (value.substring(0, 4)) {
    case "rgba": {
      params = {start: "rgba(", len: 4, alpha: true}
      break
    }
    case "rgb(": {
      params = {start: "rgb(", len: 3, alpha: false}
      break
    }
    default:
      return false
  }

  // if '.' and then ',' found, we know decimals are used on rgb
  if (new RegExp(".*?(\\.).*(,)").test(value))
    return false
    // throw new Error(`color expects integers for rgb in rgb/rgba tuple, received ${value}`)

  // extract the numerical values from inside parens
  const contents = value.replace(params.start, "").replace(")", "").split(',').map(parseFloat)

  // check length of array based on rgb/rgba
  if (contents.length != params.len)
    return false
    // throw new Error(`color expects rgba ${params.len}-tuple, received ${value}`)

  // check for valid numerical values for rgba
  if (params.alpha && !(0 <= contents[3] && contents[3] <= 1))
    return false
    // throw new Error("color expects rgba 4-tuple to have alpha value between 0 and 1")

  if (includes(contents.slice(0, 3).map((rgb) => 0 <= rgb && rgb <= 255), false))
    return false
    // throw new Error("color expects rgb to have value between 0 and 255")

  return true
}
