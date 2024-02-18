import type {uint8, uint32, Color} from "../types"
import {named_colors, is_named_color} from "./svg_colors"
import {clamp} from "./math"
import {isInteger, isString, isArray} from "./types"

const {round, sqrt} = Math

export function byte(v: number): uint8 {
  return clamp(round(v), 0, 255)
}

export type RGBA = [R: uint8, G: uint8, B: uint8, A: uint8]

export function transparent(): RGBA {
  return [0, 0, 0, 0]
}

export function encode_rgba([r, g, b, a]: RGBA): uint32 {
  return r << 24 | g << 16 | b << 8 | a
}

export function decode_rgba(rgba: uint32): RGBA {
  const r = (rgba >> 24) & 0xff
  const g = (rgba >> 16) & 0xff
  const b = (rgba >>  8) & 0xff
  const a =  rgba        & 0xff
  return [r, g, b, a]
}

export function color2rgba(color: Color | null, alpha: number = 1.0): RGBA {
  const [r, g, b, a] = (() => {
    if (color == null) {
      return transparent()
    } else if (isInteger(color)) {
      return decode_rgba(color)
    } else if (isString(color)) {
      return css4_parse(color) ?? transparent()
    } else {
      if (color.length == 2) {
        const [name, alpha] = color
        return color2rgba(name, alpha)
      } else {
        const [r, g, b, a=1.0] = color
        return [r, g, b, byte(a*255)]
      }
    }
  })()

  return [r, g, b, byte(alpha*a)]
}

const _hex_table: {[key: number]: string} = {
  0: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9",
  10: "a", 11: "b", 12: "c", 13: "d", 14: "e", 15: "f",
}

function hex(v: uint8): string {
  return _hex_table[v >> 4] + _hex_table[v & 0xf]
}

export function rgba2css([r, g, b, a]: RGBA): string {
  return `rgba(${r}, ${g}, ${b}, ${a/255})`
}

export function color2css(color: Color | null, alpha?: number): string {
  const [r, g, b, a] = color2rgba(color, alpha)
  return rgba2css([r, g, b, a])
}

export function color2hex(color: Color | null, alpha?: number): string {
  const [r, g, b, a] = color2rgba(color, alpha)
  const rgb = `#${hex(r)}${hex(g)}${hex(b)}`
  return a == 255 ? rgb : `${rgb}${hex(a)}`
}

export function color2hexrgb(color: Color | null): string {
  const [r, g, b] = color2rgba(color)
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

/*
let _last_color = "transparent"
let _last_alpha = 1.0
let _last_rgba = transparent()

export function _color2rgba(color: string | null, alpha: number = 1.0): RGBA {
  if (color == _last_color && alpha == _last_alpha)
    return [..._last_rgba]

  const [r, g, b, a] = parsed
  const rgba: RGBA = [r, g, b, a == 255 ? byte(alpha*255) : a]
  _last_color = color
  _last_alpha = alpha
  _last_rgba = rgba
  return rgba
}
*/

const rgb_modern = /^rgba?\(\s*(?<r>[^\s,]+?)\s+(?<g>[^\s,]+?)\s+(?<b>[^\s,]+?)(?:\s*\/\s*(?<a>[^\s,]+?))?\s*\)$/
const rgb_legacy = /^rgba?\(\s*(?<r>[^\s,]+?)\s*,\s*(?<g>[^\s,]+?)\s*,\s*(?<b>[^\s,]+?)(?:\s*,\s*(?<a>[^\s,]+?))?\s*\)$/

const css4_normalize = (() => {
  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext("2d")!
  const gradient = ctx.createLinearGradient(0, 0, 1, 1)
  return (color: string): string | null => {
    ctx.fillStyle = gradient // lgtm [js/useless-assignment-to-property]
    ctx.fillStyle = color
    const style = ctx.fillStyle
    return (style as typeof ctx["fillStyle"]) != gradient ? style : null
  }
})()

export function css4_parse(color: string): RGBA | null {
  /**
    Parses CSS4 color strings:

    - transparent
    - named color
    - #RRGGBB[AA]
    - #RGB[A]
    - rgb[a](R G B[ / A])
    - rgb[a](R, G, B[, A])
    - other CSS4 syntax (browser dependent)

  */
  color = color.trim().toLowerCase()

  if (color == "") {
    return null
  } else if (color == "transparent") {
    return transparent()
  } else if (is_named_color(color)) {
    return decode_rgba(named_colors[color])
  } else if (color[0] == "#") {
    const v = Number(`0x${color.substring(1)}`)
    if (isNaN(v)) {
      return null
    }
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
    if (result?.groups != null) {
      let {r, g, b, a="1"} = result.groups

      const rp = r.endsWith("%")
      const gp = g.endsWith("%")
      const bp = b.endsWith("%")
      const ap = a.endsWith("%")

      if (!(rp && gp && bp || (!rp && !gp && !bp))) {
        return null
      }

      if (rp) { r = r.slice(0, -1) }
      if (gp) { g = g.slice(0, -1) }
      if (bp) { b = b.slice(0, -1) }
      if (ap) { a = a.slice(0, -1) }

      let R = Number(r)
      let G = Number(g)
      let B = Number(b)
      let A = Number(a)

      if (isNaN(R + G + B + A)) {
        return null
      }

      if (rp) { R = 255*(R/100) }
      if (gp) { G = 255*(G/100) }
      if (bp) { B = 255*(B/100) }
      A = 255*(ap ? A/100 : A)

      R = byte(R)
      G = byte(G)
      B = byte(B)
      A = byte(A)

      return [R, G, B, A]
    }
  } else {
    const style = css4_normalize(color)
    if (style != null) {
      return css4_parse(style)
    }
  }

  return null
}

export function is_Color(value: unknown): value is Color {
  if (isInteger(value)) {
    return true
  }
  if (isString(value) && css4_parse(value) != null) {
    return true
  }
  if (isArray(value) && (value.length == 3 || value.length == 4)) {
    return true
  }
  return false
}

export function is_dark([r, g, b]: RGBA): boolean {
  const l = 1 - (0.299*r + 0.587*g + 0.114*b)/255
  return l >= 0.6
}

export function brightness(color: Color): number {
  // Perceived brightness of a color in [0, 1] range.
  // http://alienryderflex.com/hsp.html
  const [r, g, b] = color2rgba(color)
  return sqrt(0.299*r**2 + 0.587*g**2 + 0.114*b**2)/255
}

export function luminance(color: Color): number {
  // Relative luminance of a color in [0, 1] range.
  // https://en.wikipedia.org/wiki/Relative_luminance
  const [r, g, b] = color2rgba(color)
  return (0.2126*r**2.2 + 0.7152*g**2.2 + 0.0722*b**2.2) / 255**2.2
}
