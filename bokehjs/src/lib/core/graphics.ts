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
  position: Position = {sx: 0, sy: 0}
  angle?: number
  width?: {value: number, unit: "%"}
  height?: {value: number, unit: "%"}
  padding?: Padding

  abstract set visuals(v: visuals.Text | visuals.Line | visuals.Fill)

  abstract rect(): Rect
  abstract size(): Size
  abstract bbox(): BBox
  abstract paint(ctx: Context2d): void

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

//export class Box extends GraphicsBox {
//}
// new Box([new TextBox()], {angle: {value: 10, unit: "deg"}})
// width = "content"
// height = "content"

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

    this.font = v.font_value()
    this.color = color2css(color, alpha)
    this.line_height = v.text_line_height.get_value()
  }

  constructor({text}: {text: string}) {
    super()
    this.text = text
  }

  metrics() {

  }

  _size(): Size & {metrics: FontMetrics} {
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

    return {width, height, metrics}
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

  rect(): Rect {
    const {width, height, metrics} = this._size()
    const nlines = this.text.split("\n").length
    const {x, y} = this._computed_position({width, height}, metrics, nlines)

    const x0 = x
    const y0 = y
    const x1 = x + width
    const y1 = y + height

    const rect = {
      p0: {x: x0, y: y0},
      p1: {x: x0, y: y1},
      p2: {x: x1, y: y1},
      p3: {x: x1, y: y0},
    }

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

  bbox(): BBox {
    const {p0, p1, p2, p3} = this.rect()

    const left = Math.min(p0.x, p1.x, p2.x, p3.x)
    const top = Math.min(p0.y, p1.y, p2.y, p3.y)
    const right = Math.max(p0.x, p1.x, p2.x, p3.x)
    const bottom = Math.max(p0.y, p1.y, p2.y, p3.y)

    return new BBox({left, right, top, bottom})
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
    ctx.textBaseline = "top"

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

        /* TODO: background, decorations
        ctx.fillStyle = "yellow"
        ctx.fillRect(xi, y, widths[i], metrics.height)

        ctx.strokeStyle = "red"
        //ctx.moveTo(xi, Math.round(y + metrics.ascent))
        //ctx.lineTo(xi + widths[i], Math.round(y + metrics.ascent))
        //ctx.stroke()

        const r = 2
        const xa = Math.round(xi)
        const ya = Math.round(y + metrics.ascent) + 1
        ctx.moveTo(xa, ya)
        for (let k = 0, s = 1; k < widths[i]; k += 2*r, s *= -1) {
          ctx.arcTo(xa+k, ya+s*r, xa+k+r, ya+s*r, r)
          ctx.arcTo(xa+k+r, ya+s*r, xa+k+2*r, ya, r)
        }
        ctx.stroke()
        */

        ctx.fillStyle = this.color
        ctx.fillText(lines[i], xi, y)
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

  set visuals(_v: visuals.Text | visuals.Line | visuals.Fill) {}

  rect(): Rect {
    return {
      p0: {x: 0, y: 0},
      p1: {x: 0, y: 0},
      p2: {x: 0, y: 0},
      p3: {x: 0, y: 0},
    }
  }

  size(): Size {
    return {width: 0, height: 0}
  }

  bbox(): BBox {
    return new BBox()
  }

  paint(_ctx: Context2d): void {}
}

/*
export class SuperScript {
}

// sine
ctx.beginPath()
ctx.moveTo(300, 300)
for (let i = 0; i < 10; i++ {
  ctx.lineTo(300 + 5*Math.sin(30*i*Math.PI/180), 300)
}
ctx.stroke()

// arcs
x = 200;
y = 200;
r = 1;
ctx.moveTo(x, y);
for (let i = 0, s = 1; i < 300; i += 2*r, s *= -1) {
  ctx.arcTo(x+i, y+s*r, x+i+r, y+s*r, r)
  ctx.arcTo(x+i+r, y+s*r, x+i+2*r, y, r)
}
ctx.stroke()

// triangles
x = 200
y = 200
r = 1
ctx.moveTo(x, y)
  for (let i = 0, s = 1; i < 300; i += 2*r, s *= -1) {
    ctx.lineTo(x+i+r, y+s*r)
    ctx.lineTo(x+i+r, y+s*r, x+i+2*r, y, r)
}
ctx.stroke()

// sawtooth
*/
