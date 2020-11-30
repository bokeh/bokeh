import {VisualProperties} from "./visual"
import * as p from "../properties"
import * as mixins from "../property_mixins"
import {LineJoin, LineCap} from "../enums"
import {color2css} from "../util/color"
import {Context2d} from "../util/canvas"

class _Line extends VisualProperties {
  name = "line"

  readonly line_color:       p.ColorSpec
  readonly line_width:       p.NumberSpec
  readonly line_alpha:       p.NumberSpec
  readonly line_join:        p.Property<LineJoin>
  readonly line_cap:         p.Property<LineCap>
  readonly line_dash:        p.Array
  readonly line_dash_offset: p.Number

  get doit(): boolean {
    return !(this.line_color.spec.value === null ||
             this.line_alpha.spec.value == 0 ||
             this.line_width.spec.value == 0)
  }

  color_value(): string {
    return color2css(this.line_color.value(), this.line_alpha.value())
  }
}

_Line.prototype.attrs = Object.keys(mixins.LineVector)

export class Line extends _Line {
  set_value(ctx: Context2d): void {
    const color = this.line_color.value()
    const alpha = this.line_alpha.value()

    ctx.strokeStyle    = color2css(color, alpha)
    ctx.lineWidth      = this.line_width.value()
    ctx.lineJoin       = this.line_join.value()
    ctx.lineCap        = this.line_cap.value()
    ctx.lineDash       = this.line_dash.value()
    ctx.lineDashOffset = this.line_dash_offset.value()
  }
}

export class LineScalar extends Line {}

export class LineVector extends _Line {
  set_vectorize(ctx: Context2d, i: number): void {
    const color = this.cache_select(this.line_color, i)
    const alpha = this.cache_select(this.line_alpha, i)
    const width = this.cache_select(this.line_width, i)
    const join = this.cache_select(this.line_join, i)
    const cap = this.cache_select(this.line_cap, i)
    const dash = this.cache_select(this.line_dash, i)
    const offset = this.cache_select(this.line_dash_offset, i)

    ctx.strokeStyle = color2css(color, alpha)
    ctx.lineWidth = width
    ctx.lineJoin = join
    ctx.lineCap = cap
    ctx.lineDash = dash
    ctx.lineDashOffset = offset
  }
}
