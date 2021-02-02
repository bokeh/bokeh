import {Size} from "./types"
import {BBox} from "./util/bbox"
import {Context2d} from "./util/canvas"
import {font_metrics, FontMetrics} from "./util/text"
import {max, sum} from "./util/array"
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

export abstract class GraphicsBox {
  _position: Position = {sx: 0, sy: 0}
  angle?: number
  width?: {value: number, unit: "%"}
  height?: {value: number, unit: "%"}
  padding?: Padding
  font_size_scale: number = 1.0

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
        width: width*c + height*s,
        height: width*s + height*c,
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
    ctx.moveTo(p0.x, p0.y)
    ctx.lineTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.lineTo(p3.x, p3.y)
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
    ctx.moveTo(x, y)
    ctx.lineTo(x, y + height)
    ctx.lineTo(x + width, y + height)
    ctx.lineTo(x + width, y)
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
      const match = size.match(/^\s*(\d+(\.\d+)?)px\s*$/)
      if (match != null) {
        const [, px] = match
        const npx = Number(px)
        if (!isNaN(npx))
          size = `${npx*font_size_scale}px`
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

  _size(): Size & {metrics: FontMetrics} {
    const {font} = this

    const metrics = font_metrics(font)
    const line_spacing = (this.line_height - 1)*metrics.height

    const empty = this.text == ""
    const lines = this.text.split("\n")
    const widths = lines.map((line) => text_width(line, font))

    const nlines = lines.length

    const w_scale = this.width?.unit == "%" ? this.width.value : 1
    const h_scale = this.height?.unit == "%" ? this.height.value : 1

    const width = max(widths)*w_scale
    const height = empty ? 0 : (metrics.height*nlines + line_spacing*(nlines - 1))*h_scale

    return {width, height, metrics}
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
          case "baseline": return nlines == 1 ? metrics.ascent /*+ padding.top*/ : 0.5*height
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

    const metrics = font_metrics(font)
    const line_spacing = (this.line_height - 1)*metrics.height

    const lines = this.text.split("\n")
    const widths = lines.map((line) => text_width(line, font))

    const nlines = lines.length

    const w_scale = this.width?.unit == "%" ? this.width.value : 1
    const h_scale = this.height?.unit == "%" ? this.height.value : 1

    const width = max(widths)*w_scale
    const height = (metrics.height*nlines + line_spacing*(nlines - 1))*h_scale

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

    let {x, y} = this._computed_position({width, height}, metrics, nlines)

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
        y += metrics.height + line_spacing
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
        ctx.fillText(lines[i], xi, y + metrics.ascent)
        y += metrics.height + line_spacing
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

    this.base.position = {
      sx: 0, x_anchor: "left",
      sy: es.height*0.5, y_anchor: "top",
    }


    this.expo.position = {
      sx: bs.width, x_anchor: "left",
      sy: 0, y_anchor: "top",
    }
  }

  get position(): Position {
    return this._position
  }

  set visuals(v: visuals.Text | visuals.Line | visuals.Fill) {
    this.expo.font_size_scale = 0.8
    this.base.visuals = v
    this.expo.visuals = v
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
      height: bs.height + es.height*0.5,
    }
  }

  paint(ctx: Context2d): void {
    const {x, y} = this._computed_position()
    ctx.save()
    ctx.translate(x, y)
    this.base.paint(ctx)
    this.expo.paint(ctx)
    ctx.restore()
  }

  // paint_rect ...

  paint_bbox(ctx: Context2d): void {
    super.paint_bbox(ctx)
    // translate?
    /*
    for (const child of this.children) {
      child.paint_bbox(ctx)
    }
    */
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
