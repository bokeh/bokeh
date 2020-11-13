import {css_colors, is_css_color} from "./svg_colors"
import {includes} from "./array"
import {uint8, uint32} from "../types"

const {round, min, max} = Math

function clamp(v: number, lo: number, hi: number): number {
  return max(lo, min(v, hi))
}

export function is_color(value: string): boolean {
  return is_css_color(value.toLowerCase()) || value.substring(0, 1) == "#" || valid_rgb(value)
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
  else if (is_css_color(color))
    return rgb2hex(...css_colors[color])
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
export type RGBAf = [number, number, number, number]

export function encode_rgba([r, g, b, a]: RGBAf): uint32 {
  return (r*255 | 0) << 24 | (g*255 | 0) << 16 | (b*255 | 0) << 8 | (a*255 | 0)
}

export function decode_rgba(rgba: uint32): RGBAf {
  const r = ((rgba >> 24) & 0xff) / 255
  const g = ((rgba >> 16) & 0xff) / 255
  const b = ((rgba >>  8) & 0xff) / 255
  const a = ((rgba >>  0) & 0xff) / 255
  return [r, g, b, a]
}

function transparent(): RGBAf {
  return [0, 0, 0, 0]
}

let _last_color = "transparent"
let _last_alpha = 1.0
let _last_rgbaf = transparent()

export function color2rgba(color: string | null, alpha: number = 1.0): RGBAf {
  if (!color || color == "transparent")  // NaN, null, '', etc.
    return transparent()

  if (color == _last_color && alpha == _last_alpha)
    return [..._last_rgbaf]

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

  const rgbaf = rgba.slice(0, 4) as RGBAf
  _last_color = color
  _last_alpha = alpha
  _last_rgbaf = rgbaf
  return rgbaf
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

export type RGB/*f?*/ = [number, number, number]

export function hsl_to_rgb(h: number, s: number, l: number): RGB {
  if (s == 0)
    return [l, l, l]
  const q = l <= 0.5 ? l + l*s : l + s - l*s
  const p = 2*l - q
  const r = _hue_to_rgb(p, q, h + 1/3)
  const g = _hue_to_rgb(p, q, h)
  const b = _hue_to_rgb(p, q, h - 1/3)
  return [r, g, b]
}

function _hue_to_rgb(p: number, q: number, t: number): number {
  if (t < 0)
    t += 1
  else if (t > 1)
    t -= 1
  if (t < 1/6)
    return p + 6*(q - p)*t
  if (t < 1/2)
    return q
  if (t < 2/3)
    return p + 6*(q - p)*(2/3 - t)
  return p
}

export type RGBAi = [uint8, uint8, uint8, uint8]

function transparent_i(): RGBAi {
  return [0, 0, 0, 0]
}

export function encode_rgba_i([r, g, b, a]: RGBAi): uint32 {
  return r << 24 | g << 16 | b << 8 | a
}

export function decode_rgba_i(rgba: uint32): RGBAi {
  const r = (rgba >> 24) & 0xff
  const g = (rgba >> 16) & 0xff
  const b = (rgba >>  8) & 0xff
  const a =  rgba        & 0xff
  return [r, g, b, a]
}

const rgb_modern = /^rgba?\(\s*(?<r>.+?)\s+(?<g>.+?)\s+(?<b>.+?)(?:\s*\/\s*(?<a>.+?))?\s*\)$/
const rgb_legacy = /^rgba?\(\s*(?<r>.+?)\s*,\s*(?<g>.+?)\s*,\s*(?<b>.+?)(?:\s*,\s*(?<a>.+?))?\s*\)$/

const hsl_modern = /^hsla?\(\s*(?<h>.+?)\s+(?<s>.+?)\s+(?<l>.+?)(?:\s*\/\s*(?<a>.+?))?\s*\)$/
const hsl_legacy = /^hsla?\(\s*(?<h>.+?)\s*,\s*(?<s>.+?)\s*,\s*(?<l>.+?)(?:\s*,\s*(?<a>.+?))?\s*\)$/

export function css4_parse(color: string): RGBAi | null {
  /**
    Parses CSS4 color strings:

    - transparent
    - #RRGGBB[AA]
    - #RGB[A]
    - rgb[a](R G B[ / A])
    - rgb[a](R, G, B[, A])
    - hsl[a](H S L[ / A])
    - hsl[a](H, S, L[, A])

  */
  color = color.trim().toLowerCase()

  if (!color)
    return null
  else if (color == "transparent")
    return transparent_i()
  else if (is_css_color(color))
    return [...css_colors[color], 255]
  else if (color[0] == "#") {
    const v = Number("0x" + color.substr(1))
    if (isNaN(v))
      return null
    switch (color.length - 1) {
      case 3: {
        const r = (v >> 8) & 0xf
        const g = (v >> 4) & 0xf
        const b = (v >> 0) & 0xf
        const rr = (r << 4) | r
        const gg = (g << 4) | g
        const bb = (b << 4) | b
        return [rr, gg, bb, 255]
      }
      case 4: {
        const r = (v >> 12) & 0xf
        const g = (v >>  8) & 0xf
        const b = (v >>  4) & 0xf
        const a = (v >>  0) & 0xf
        const rr = (r << 4) | r
        const gg = (g << 4) | g
        const bb = (b << 4) | b
        const aa = (a << 4) | a
        return [rr, gg, bb, aa]
      }
      case 6: {
        const rr = (v >> 16) & 0xff
        const gg = (v >>  8) & 0xff
        const bb = (v >>  0) & 0xff
        return [rr, gg, bb, 255]
      }
      case 8: {
        const rr = (v >> 24) & 0xff
        const gg = (v >> 16) & 0xff
        const bb = (v >>  8) & 0xff
        const aa = (v >>  0) & 0xff
        return [rr, gg, bb, aa]
      }
    }
  } else if (color.startsWith("rgb")) {
    const result = color.match(rgb_modern) ?? color.match(rgb_legacy)
    if (result != null) {
      let [, r, g, b, a="1"] = result // XXX: use groups when IE is dropped
      const rp = r.endsWith("%")
      const gp = g.endsWith("%")
      const bp = b.endsWith("%")
      const ap = a.endsWith("%")

      if (!(rp && gp && bp || (!rp && !gp && !bp)))
        return null

      if (rp) r = r.slice(0, -1)
      if (gp) g = g.slice(0, -1)
      if (bp) g = b.slice(0, -1)
      if (ap) a = a.slice(0, -1)

      let R = Number(r)
      let G = Number(g)
      let B = Number(b)
      let A = Number(a)

      if (isNaN(R + G + B + A))
        return null

      if (rp) R = 255*(R/100)
      if (gp) G = 255*(G/100)
      if (bp) B = 255*(B/100)
      A = 255*(ap ? A/100 : A)

      R = clamp(round(R), 0, 255)
      G = clamp(round(G), 0, 255)
      B = clamp(round(B), 0, 255)
      A = clamp(round(A), 0, 255)

      return [R, G, B, A]
    }
  } else if (color.startsWith("hsl")) {
    const result = color.match(hsl_modern) ?? color.match(hsl_legacy)
    if (result != null) {
    }
      /*
      let [, h, s, l, a="1"] = result // XXX: use groups when IE is dropped
      const c = (() => {
        switch (true) {
        case h.endsWith("deg"): {
    case "deg":  return -PI/180
    case "rad":  return -1
    case "grad": return -PI/200
    case "turn": return -2*PI
        }
        case h.endsWith("rad"): {
        }
        case h.endsWith("grad"): {
        }
        case h.endsWith("turn"): {
        }
      }
      //deg|rad|grad|turn


      const rp = h.endsWith("%")
      const gp = s.endsWith("%")
      const bp = l.endsWith("%")
      const ap = a.endsWith("%")

        */
    /*
hsla?\(
hue = num | (num ())
p
p
*/

  }

  return null
}
