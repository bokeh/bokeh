import {Size} from "./types"
import {BBox} from "./util/bbox"
import {Context2d} from "./util/canvas"
import {font_metrics, /*glyph_metrics,*/ FontMetrics} from "./util/text"
import {max, max_by, sum} from "./util/array"
import {isNumber} from "./util/types"
import {Rect, AffineTransform} from "./util/affine"
import {color2css} from "./util/color"
import * as visuals from "./visuals"

export const text_width: (text: string, font: string) => number = (() => {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!
  let current_font = ""

  return (text: string, font: string): number => {
    if (font != current_font) {
      current_font = font
      ctx.font = font
    }
    return ctx.measureText(text).width
  }
})()

type Position = {
  sx: number
  sy: number
  x_anchor?: number | "left" | "center" | "right"
  y_anchor?: number | "top"  | "center" | "baseline" | "bottom"
}

type Val = number | {value: number, unit: "px" | "%"}
type Extents = {left: Val, right: Val, top: Val, bottom: Val}
type Padding = Val | [v: Val, h: Val] | [top: Val, right: Val, bottom: Val, left: Val] | Extents
type TextHeightMetric = "x" | "cap" | "ascent" | "x_descent" | "cap_descent" | "ascent_descent"

export abstract class GraphicsBox {
  _position: Position = {sx: 0, sy: 0}
  angle?: number
  width?: {value: number, unit: "%"}
  height?: {value: number, unit: "%"}
  padding?: Padding
  font_size_scale: number = 1.0
  text_height_metric?: TextHeightMetric

  set position(p: Position) {
    this._position = p
  }

  get position(): Position {
    return this._position
  }

  abstract set visuals(v: visuals.Text | visuals.Line | visuals.Fill)

  abstract _rect(): Rect
  abstract _size(): Size
  abstract paint(ctx: Context2d): void

  infer_text_height(): TextHeightMetric {
    return "ascent_descent"
  }

  bbox(): BBox {
    const {p0, p1, p2, p3} = this.rect()

    const left = Math.min(p0.x, p1.x, p2.x, p3.x)
    const top = Math.min(p0.y, p1.y, p2.y, p3.y)
    const right = Math.max(p0.x, p1.x, p2.x, p3.x)
    const bottom = Math.max(p0.y, p1.y, p2.y, p3.y)

    return new BBox({left, right, top, bottom})
  }

  size(): Size {
    const {width, height} = this._size()
    const {angle} = this
    if (!angle)
      return {width, height}
    else {
      const c = Math.cos(Math.abs(angle))
      const s = Math.sin(Math.abs(angle))

      return {
        width: Math.abs(width*c + height*s),
        height: Math.abs(width*s + height*c),
      }
    }
  }

  rect(): Rect {
    const rect = this._rect()
    const {angle} = this
    if (!angle)
      return rect
    else {
      const {sx, sy} = this.position
      const tr = new AffineTransform()
      tr.translate(sx, sy)
      tr.rotate(angle)
      tr.translate(-sx, -sy)
      return tr.apply_rect(rect)
    }
  }

  paint_rect(ctx: Context2d): void {
    const {p0, p1, p2, p3} = this.rect()
    ctx.save()
    ctx.strokeStyle = "red"
    ctx.lineWidth = 1
    ctx.beginPath()
    const {round} = Math
    ctx.moveTo(round(p0.x), round(p0.y))
    ctx.lineTo(round(p1.x), round(p1.y))
    ctx.lineTo(round(p2.x), round(p2.y))
    ctx.lineTo(round(p3.x), round(p3.y))
    ctx.closePath()
    ctx.stroke()
    ctx.restore()
  }

  paint_bbox(ctx: Context2d): void {
    const {x, y, width, height} = this.bbox()
    ctx.save()
    ctx.strokeStyle = "blue"
    ctx.lineWidth = 1
    ctx.beginPath()
    const {round} = Math
    ctx.moveTo(round(x), round(y))
    ctx.lineTo(round(x), round(y + height))
    ctx.lineTo(round(x + width), round(y + height))
    ctx.lineTo(round(x + width), round(y))
    ctx.closePath()
    ctx.stroke()
    ctx.restore()
  }
}

export class TextBox extends GraphicsBox {
  text: string
  color: string
  font: string
  line_height: number
  align: "left" | "center" | "right" | "justify" = "left"
  //padding: Padding

  set visuals(v: visuals.Text) {
    const color = v.text_color.get_value()
    const alpha = v.text_alpha.get_value()
    const style = v.text_font_style.get_value()
    let size = v.text_font_size.get_value()
    const face = v.text_font.get_value()

    const {font_size_scale} = this
    if (font_size_scale != 1.0) {
      const match = size.match(/^\s*(\d+(\.\d+)?)(\w+)\s*$/)
      if (match != null) {
        const [, value,, unit] = match
        const number = Number(value)
        if (!isNaN(number))
          size = `${number*font_size_scale}${unit}`
      }
    }

    const font = `${style} ${size} ${face}`
    this.font = font
    this.color = color2css(color, alpha)
    this.line_height = v.text_line_height.get_value()
  }

  constructor({text}: {text: string}) {
    super()
    this.text = text
  }

  infer_text_height() {
    if (this.text.includes("\n"))
      return "ascent_descent"
    else {
      function is_math_like(text: string): boolean {
        for (const c of new Set(text)) {
          if ("0" <= c && c <= "9")
            continue
          switch (c) {
            case ",":
            case ".":
            case "+":
            case "-":
            case "\u2212":
            case "e":
              continue
            default:
              return false
          }
        }
        return true
      }

      if (is_math_like(this.text))
        return "cap"
      else
        return "ascent_descent"

      /*
      const {font} = this
      const fmetrics = font_metrics(font)

      let max_ascent = 0
      let max_descent = 0
      for (const c of this.text) {
        const metrics = glyph_metrics(c, font)
        max_ascent = Math.max(metrics.ascent)
        max_descent = Math.max(metrics.descent)
      }

      const ascent = (() => {
        if (max_ascent > fmetrics.cap_height)
          return "ascent"
        else if (max_ascent > fmetrics.x_height)
          return "cap"
        else
          return "x"
      })()

      return max_descent > 0 ? `${ascent}_descent` as const : ascent
      */
    }
  }

  _text_line(fmetrics: FontMetrics): {height: number, ascent: number, descent: number} {
    const metric = this.text_height_metric ?? this.infer_text_height()

    const ascent = (() => {
      switch (metric) {
        case "x":
        case "x_descent":
          return fmetrics.x_height
        case "cap":
        case "cap_descent":
          return fmetrics.cap_height
        case "ascent":
        case "ascent_descent":
          return fmetrics.ascent
      }
    })()

    const descent = (() => {
      switch (metric) {
        case "x":
        case "cap":
        case "ascent":
          return 0
        case "x_descent":
        case "cap_descent":
        case "ascent_descent":
          return fmetrics.descent
      }
    })()

    return {height: ascent + descent, ascent, descent}
  }

  get nlines(): number {
    const lines = this.text.split("\n")
    return lines.length
  }

  _size(): Size & {metrics: FontMetrics} {
    const {font} = this

    const fmetrics = font_metrics(font)
    const line_spacing = (this.line_height - 1)*fmetrics.height // TODO: max(trailing(L[n-1]), leading(L[n]))

    const empty = this.text == ""
    const lines = this.text.split("\n")
    const nlines = lines.length

    const widths = lines.map((line) => text_width(line, font))
    const text_line = this._text_line(fmetrics)
    const text_height = text_line.height*nlines
    /*
    const heights: number[] = []
    const ascents: number[] = []
    const descents: number[] = []

    for (const line of lines) {
      const metrics = [...line].map((c) => glyph_metrics(c, font))
      const max_ascent = Math.max(max(metrics.map((m) => m.ascent)), fmetrics.cap_height)
      const max_descent = max(metrics.map((m) => m.descent))
      ascents.push(max_ascent)
      descents.push(max_descent)
      heights.push(max_ascent + max_descent)
    }

    const text_height = sum(heights)
    */

    const w_scale = this.width?.unit == "%" ? this.width.value : 1
    const h_scale = this.height?.unit == "%" ? this.height.value : 1

    const width = max(widths)*w_scale
    const height = empty ? 0 : (text_height + line_spacing*(nlines - 1))*h_scale

    return {width, height, metrics: fmetrics}
  }

  _computed_position(size: Size, metrics: FontMetrics, nlines: number): {x: number, y: number} {
    const {width, height} = size
    const {sx, sy, x_anchor="left", y_anchor="center"} = this.position

    const x = sx - (() => {
      if (isNumber(x_anchor))
        return x_anchor*width
      else {
        switch (x_anchor) {
          case "left": return 0
          case "center": return 0.5*width
          case "right": return width
        }
      }
    })()

    const y = sy - (() => {
      if (isNumber(y_anchor))
        return y_anchor*height
      else {
        switch (y_anchor) {
          case "top": return 0
          case "center": return 0.5*height
          case "bottom": return height
          case "baseline": {
            if (nlines == 1) {
              const metric = this.text_height_metric ?? this.infer_text_height()
              switch (metric) {
                case "x":
                case "x_descent":
                  return metrics.x_height
                case "cap":
                case "cap_descent":
                  return metrics.cap_height
                case "ascent":
                case "ascent_descent":
                  return metrics.ascent
              }
            } else
              return 0.5*height
          }
        }
      }
    })()

    return {x, y}
  }

  _rect(): Rect {
    const {width, height, metrics} = this._size()
    const nlines = this.text.split("\n").length
    const {x, y} = this._computed_position({width, height}, metrics, nlines)

    const bbox = new BBox({x, y, width, height})
    return bbox.rect
  }

  paint(ctx: Context2d): void {
    const {font} = this

    const fmetrics = font_metrics(font)
    const line_spacing = (this.line_height - 1)*fmetrics.height // TODO: see above

    const lines = this.text.split("\n")
    const nlines = lines.length

    const widths = lines.map((line) => text_width(line, font))
    const text_line = this._text_line(fmetrics)
    const text_height = text_line.height*nlines

    /*
    const heights: number[] = []
    const ascents: number[] = []
    const descents: number[] = []

    for (const line of lines) {
      const metrics = [...line].map((c) => glyph_metrics(c, font))
      const max_ascent = Math.max(max(metrics.map((m) => m.ascent)), fmetrics.cap_height)
      const max_descent = max(metrics.map((m) => m.descent))
      ascents.push(max_ascent)
      descents.push(max_descent)
      heights.push(max_ascent + max_descent)
    }
    */

    const w_scale = this.width?.unit == "%" ? this.width.value : 1
    const h_scale = this.height?.unit == "%" ? this.height.value : 1

    const width = max(widths)*w_scale
    const height = (text_height + line_spacing*(nlines - 1))*h_scale

    ctx.save()
    ctx.fillStyle = this.color
    ctx.font = this.font
    ctx.textAlign = "left"
    ctx.textBaseline = "alphabetic"

    const {sx, sy} = this.position
    const {align} = this

    const {angle} = this
    if (angle) {
      ctx.translate(sx, sy)
      ctx.rotate(angle)
      ctx.translate(-sx, -sy)
    }

    let {x, y} = this._computed_position({width, height}, fmetrics, nlines)

    if (align == "justify") {
      for (let i = 0; i < nlines; i++) {
        let xij = x
        const line = lines[i]
        const words = line.split(" ")
        const nwords = words.length
        const word_widths = words.map((word) => text_width(word, font))
        const word_spacing = (width - sum(word_widths))/(nwords - 1)
        for (let j = 0; j < nwords; j++) {
          ctx.fillText(words[j], xij, y)
          xij += word_widths[j] + word_spacing
        }
        y += /*heights[i]*/ text_line.height + line_spacing
      }
    } else {
      for (let i = 0; i < nlines; i++) {
        const xi = x + (() => {
          switch (align) {
            case "left": return 0
            case "center": return 0.5*(width - widths[i])
            case "right": return width - widths[i]
          }
        })()

        ctx.fillStyle = this.color
        ctx.fillText(lines[i], xi, y + /*ascents[i]*/ text_line.ascent)
        y += /*heights[i]*/ text_line.height + line_spacing
      }
    }

    ctx.restore()
  }
}

export class BaseExpo extends GraphicsBox {
  constructor(readonly base: GraphicsBox, readonly expo: GraphicsBox) {
    super()
  }

  get children(): GraphicsBox[] {
    return [this.base, this.expo]
  }

  set position(p: Position) {
    this._position = p

    const bs = this.base.size()
    const es = this.expo.size()

    const shift = this._shift_scale()*bs.height
    const height = Math.max(bs.height, shift + es.height)

    this.base.position = {
      sx: 0, x_anchor: "left",
      sy: height, y_anchor: "bottom",
    }

    this.expo.position = {
      sx: bs.width, x_anchor: "left",
      sy: shift, y_anchor: "bottom",
    }
  }

  get position(): Position {
    return this._position
  }

  set visuals(v: visuals.Text | visuals.Line | visuals.Fill) {
    this.expo.font_size_scale = 0.7
    this.base.visuals = v
    this.expo.visuals = v
  }

  _shift_scale(): number {
    if (this.base instanceof TextBox && this.base.nlines == 1) {
      const {x_height, cap_height} = font_metrics(this.base.font)
      return x_height/cap_height
    } else {
      return 2/3
    }
  }

  infer_text_height() {
    return this.base.infer_text_height()
  }

  _rect(): Rect {
    const bb = this.base.bbox()
    const eb = this.expo.bbox()

    const bbox = bb.union(eb)
    const {x, y} = this._computed_position()
    return bbox.translate(x, y).rect
  }

  _size(): Size {
    const bs = this.base.size()
    const es = this.expo.size()

    return {
      width: bs.width + es.width,
      height: Math.max(bs.height, this._shift_scale()*bs.height + es.height),
    }
  }

  paint(ctx: Context2d): void {
    ctx.save()
    const {angle} = this
    if (angle) {
      const {sx, sy} = this.position
      ctx.translate(sx, sy)
      ctx.rotate(angle)
      ctx.translate(-sx, -sy)
    }
    const {x, y} = this._computed_position()
    ctx.translate(x, y)
    this.base.paint(ctx)
    this.expo.paint(ctx)
    ctx.restore()
  }

  // paint_rect ...

  paint_bbox(ctx: Context2d): void {
    super.paint_bbox(ctx)
    const {x, y} = this._computed_position()
    ctx.save()
    ctx.translate(x, y)
    for (const child of this.children) {
      child.paint_bbox(ctx)
    }
    ctx.restore()
  }

  _computed_position(): {x: number, y: number} {
    const {width, height} = this._size()
    const {sx, sy, x_anchor="left", y_anchor="center"} = this.position

    const x = sx - (() => {
      if (isNumber(x_anchor))
        return x_anchor*width
      else {
        switch (x_anchor) {
          case "left": return 0
          case "center": return 0.5*width
          case "right": return width
        }
      }
    })()

    const y = sy - (() => {
      if (isNumber(y_anchor))
        return y_anchor*height
      else {
        switch (y_anchor) {
          case "top": return 0
          case "center": return 0.5*height
          case "bottom": return height
          case "baseline": return 0.5*height /* TODO */
        }
      }
    })()

    return {x, y}
  }
}

export class GraphicsBoxes {
  constructor(readonly items: GraphicsBox[]) {}

  get length(): number {
    return this.items.length
  }

  set visuals(v: visuals.Text | visuals.Line | visuals.Fill) {
    for (const item of this.items) {
      item.visuals = v
    }

    const metric_map = {x: 0, cap: 1, ascent: 2, x_descent: 3, cap_descent: 4, ascent_descent: 5}
    const common = max_by(this.items.map((item) => item.infer_text_height()), (metric) => metric_map[metric])

    for (const item of this.items) {
      item.text_height_metric = common
    }
  }

  set angle(a: number) {
    for (const item of this.items) {
      item.angle = a
    }
  }

  max_size(): Size {
    let width = 0
    let height = 0
    for (const item of this.items) {
      const size = item.size()
      width = Math.max(width, size.width)
      height = Math.max(height, size.height)
    }
    return {width, height}
  }
}
