import type {ValuesOf} from "./visual"
import {VisualProperties, VisualUniforms} from "./visual"
import type {uint32} from "../types"
import type * as p from "../properties"
import * as mixins from "../property_mixins"
import type {LineJoin, LineCap, LineDash} from "../enums"
import {color2css} from "../util/color"
import type {Context2d} from "../util/canvas"
import {isArray, isInteger} from "../util/types"

export function resolve_line_dash(line_dash: LineDash | string | number[]): number[] {
  if (isArray(line_dash))
    return line_dash
  else {
    switch (line_dash) {
      case "solid":   return []
      case "dashed":  return [6]
      case "dotted":  return [2, 4]
      case "dotdash": return [2, 4, 6, 4]
      case "dashdot": return [6, 4, 2, 4]
      default:
        return line_dash.split(" ").map(Number).filter(isInteger)
    }
  }
}

export interface Line extends Readonly<mixins.Line> {}
export class Line extends VisualProperties {
  get doit(): boolean {
    const color = this.line_color.get_value()
    const alpha = this.line_alpha.get_value()
    const width = this.line_width.get_value()

    return !(color == null || alpha == 0 || width == 0)
  }

  apply(ctx: Context2d): boolean {
    const {doit} = this
    if (doit) {
      this.set_value(ctx)
      ctx.stroke()
    }
    return doit
  }

  declare Values: ValuesOf<mixins.Line>
  values(): this["Values"] {
    return {
      color:  this.line_color.get_value(),
      alpha:  this.line_alpha.get_value(),
      width:  this.line_width.get_value(),
      join:   this.line_join.get_value(),
      cap:    this.line_cap.get_value(),
      dash:   this.line_dash.get_value(),
      offset: this.line_dash_offset.get_value(),
    }
  }

  set_value(ctx: Context2d): void {
    const color = this.line_color.get_value()
    const alpha = this.line_alpha.get_value()

    ctx.strokeStyle    = color2css(color, alpha)
    ctx.lineWidth      = this.line_width.get_value()
    ctx.lineJoin       = this.line_join.get_value()
    ctx.lineCap        = this.line_cap.get_value()
    ctx.setLineDash(resolve_line_dash(this.line_dash.get_value()))
    ctx.lineDashOffset = this.line_dash_offset.get_value()
  }
}

export class LineScalar extends VisualUniforms {
  declare readonly line_color:       p.UniformScalar<uint32>
  declare readonly line_alpha:       p.UniformScalar<number>
  declare readonly line_width:       p.UniformScalar<number>
  declare readonly line_join:        p.UniformScalar<LineJoin>
  declare readonly line_cap:         p.UniformScalar<LineCap>
  declare readonly line_dash:        p.UniformScalar<LineDash | number[]>
  declare readonly line_dash_offset: p.UniformScalar<number>

  get doit(): boolean {
    const color = this.line_color.value
    const alpha = this.line_alpha.value
    const width = this.line_width.value

    return !(color == 0 || alpha == 0 || width == 0)
  }

  apply(ctx: Context2d): boolean {
    const {doit} = this
    if (doit) {
      this.set_value(ctx)
      ctx.stroke()
    }
    return doit
  }

  declare Values: ValuesOf<mixins.Line>
  values(): this["Values"] {
    return {
      color:  this.line_color.value,
      alpha:  this.line_alpha.value,
      width:  this.line_width.value,
      join:   this.line_join.value,
      cap:    this.line_cap.value,
      dash:   this.line_dash.value,
      offset: this.line_dash_offset.value,
    }
  }

  set_value(ctx: Context2d): void {
    const color = this.line_color.value
    const alpha = this.line_alpha.value

    ctx.strokeStyle    = color2css(color, alpha)
    ctx.lineWidth      = this.line_width.value
    ctx.lineJoin       = this.line_join.value
    ctx.lineCap        = this.line_cap.value
    ctx.setLineDash(resolve_line_dash(this.line_dash.value))
    ctx.lineDashOffset = this.line_dash_offset.value
  }
}

export class LineVector extends VisualUniforms {
  declare readonly line_color:       p.Uniform<uint32>
  declare readonly line_alpha:       p.Uniform<number>
  declare readonly line_width:       p.Uniform<number>
  declare readonly line_join:        p.Uniform<LineJoin>
  declare readonly line_cap:         p.Uniform<LineCap>
  declare readonly line_dash:        p.Uniform<LineDash | number[]>
  declare readonly line_dash_offset: p.Uniform<number>

  get doit(): boolean {
    const {line_color} = this
    if (line_color.is_Scalar() && line_color.value == 0)
      return false
    const {line_alpha} = this
    if (line_alpha.is_Scalar() && line_alpha.value == 0)
      return false
    const {line_width} = this
    if (line_width.is_Scalar() && line_width.value == 0)
      return false
    return true
  }

  v_doit(i: number): boolean {
    if (this.line_color.get(i) == 0)
      return false
    if (this.line_alpha.get(i) == 0)
      return false
    if (this.line_width.get(i) == 0)
      return false
    return true
  }

  apply(ctx: Context2d, i: number): boolean {
    const doit = this.v_doit(i)
    if (doit) {
      this.set_vectorize(ctx, i)
      ctx.stroke()
    }
    return doit
  }

  declare Values: ValuesOf<mixins.Line>
  values(i: number): this["Values"] {
    return {
      color:  this.line_color.get(i),
      alpha:  this.line_alpha.get(i),
      width:  this.line_width.get(i),
      join:   this.line_join.get(i),
      cap:    this.line_cap.get(i),
      dash:   this.line_dash.get(i),
      offset: this.line_dash_offset.get(i),
    }
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
    ctx.setLineDash(resolve_line_dash(dash))
    ctx.lineDashOffset = offset
  }
}

Line.prototype.type = "line"
Line.prototype.attrs = Object.keys(mixins.Line)

LineScalar.prototype.type = "line"
LineScalar.prototype.attrs = Object.keys(mixins.LineScalar)

LineVector.prototype.type = "line"
LineVector.prototype.attrs = Object.keys(mixins.LineVector)
