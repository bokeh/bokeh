import {VisualProperties} from "./visual"
import {Color} from "../types"
import * as p from "../properties"
import * as mixins from "../property_mixins"
import {LineJoin, LineCap} from "../enums"
import {color2css, RGBA} from "../util/color"
import {Context2d} from "../util/canvas"

abstract class _Line extends VisualProperties {
  name = "line"
}
_Line.prototype.attrs = Object.keys(mixins.LineVector)

export class Line extends _Line {
  readonly line_color:       p.Property<Color | null>
  readonly line_alpha:       p.Property<number>
  readonly line_width:       p.Property<number>
  readonly line_join:        p.Property<LineJoin>
  readonly line_cap:         p.Property<LineCap>
  readonly line_dash:        p.Property<number[]>
  readonly line_dash_offset: p.Property<number>

  get doit(): boolean {
    const color = this.line_color.get_value()
    const alpha = this.line_alpha.get_value()
    const width = this.line_width.get_value()

    return !(color == null || alpha == 0 || width == 0)
  }

  set_value(ctx: Context2d): void {
    const color = this.line_color.get_value()
    const alpha = this.line_alpha.get_value()

    ctx.strokeStyle    = color2css(color, alpha)
    ctx.lineWidth      = this.line_width.get_value()
    ctx.lineJoin       = this.line_join.get_value()
    ctx.lineCap        = this.line_cap.get_value()
    ctx.lineDash       = this.line_dash.get_value()
    ctx.lineDashOffset = this.line_dash_offset.get_value()
  }
}

export class LineScalar extends _Line {
  readonly line_color:       p.UniformScalar<RGBA>
  readonly line_alpha:       p.UniformScalar<number>
  readonly line_width:       p.UniformScalar<number>
  readonly line_join:        p.UniformScalar<LineJoin>
  readonly line_cap:         p.UniformScalar<LineCap>
  readonly line_dash:        p.UniformScalar<number[]>
  readonly line_dash_offset: p.UniformScalar<number>

  get doit(): boolean {
    const color = this.line_color.value
    const alpha = this.line_alpha.value
    const width = this.line_width.value

    return !(color == 0 || alpha == 0 || width == 0)
  }

  set_value(ctx: Context2d): void {
    const color = this.line_color.value
    const alpha = this.line_alpha.value

    ctx.strokeStyle    = color2css(color, alpha)
    ctx.lineWidth      = this.line_width.value
    ctx.lineJoin       = this.line_join.value
    ctx.lineCap        = this.line_cap.value
    ctx.lineDash       = this.line_dash.value
    ctx.lineDashOffset = this.line_dash_offset.value
  }
}

export class LineVector extends _Line {
  readonly line_color:       p.Uniform<RGBA>
  readonly line_alpha:       p.Uniform<number>
  readonly line_width:       p.Uniform<number>
  readonly line_join:        p.Uniform<LineJoin>
  readonly line_cap:         p.Uniform<LineCap>
  readonly line_dash:        p.Uniform<number[]>
  readonly line_dash_offset: p.Uniform<number>

  get doit(): boolean {
    const color = this.line_color.value
    const alpha = this.line_alpha.value
    const width = this.line_width.value

    return !(color == 0 || alpha == 0 || width == 0)
  }

  set_vectorize(ctx: Context2d, i: number): void {
    const color = this.line_color.get(i)
    const alpha = this.line_alpha.get(i)
    const width = this.line_width.get(i)
    const join = this.line_join.get(i)
    const cap = this.line_cap.get(i)
    const dash = this.line_dash.get(i)
    const offset = this.line_dash_offset.get(i)

    ctx.strokeStyle = color2css(color, alpha)
    ctx.lineWidth = width
    ctx.lineJoin = join
    ctx.lineCap = cap
    ctx.lineDash = dash
    ctx.lineDashOffset = offset
  }
}
