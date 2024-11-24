import type {ValuesOf} from "./visual"
import {VisualProperties, VisualUniforms} from "./visual"
import type {uint32, Color} from "../types"
import type * as p from "../properties"
import * as mixins from "../property_mixins"
import {LineJoin, LineCap, LineDash} from "../enums"
import {color2css} from "../util/color"
import type {Context2d} from "../util/canvas"
import {isArray, isInteger} from "../util/types"

export function resolve_line_dash(line_dash: LineDash | string | number[]): number[] {
  if (isArray(line_dash)) {
    return line_dash
  } else {
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
    const color = this.get_line_color()
    const alpha = this.get_line_alpha()
    const width = this.get_line_width()

    return !(color == null || alpha == 0 || width == 0)
  }

  apply(ctx: Context2d, path?: Path2D): boolean {
    const {doit} = this
    if (doit) {
      this.set_value(ctx)
      if (path != null) {
        ctx.stroke(path)
      } else {
        ctx.stroke()
      }
    }
    return doit
  }

  declare Values: ValuesOf<mixins.Line>
  declare ComputedValues: {
    color:  string
    width:  number
    join:   LineJoin
    cap:    LineCap
    dash:   LineDash | number[]
    offset: number
  }

  values(): this["Values"] {
    return {
      color:  this.get_line_color(),
      alpha:  this.get_line_alpha(),
      width:  this.get_line_width(),
      join:   this.get_line_join(),
      cap:    this.get_line_cap(),
      dash:   this.get_line_dash(),
      offset: this.get_line_dash_offset(),
    }
  }

  computed_values(): this["ComputedValues"] {
    const color = this.get_line_color()
    const alpha = this.get_line_alpha()
    return {
      color:  color2css(color, alpha),
      width:  this.get_line_width(),
      join:   this.get_line_join(),
      cap:    this.get_line_cap(),
      dash:   this.get_line_dash(),
      offset: this.get_line_dash_offset(),
    }
  }

  set_value(ctx: Context2d): void {
    const {color, width, join, cap, dash, offset} = this.computed_values()
    ctx.strokeStyle    = color
    ctx.lineWidth      = width
    ctx.lineJoin       = join
    ctx.lineCap        = cap
    ctx.setLineDash(resolve_line_dash(dash))
    ctx.lineDashOffset = offset
  }

  get_line_color(): Color | null {
    const css_color = this._get_css_value("line-color")
    if (css_color != "") {
      return css_color
    }
    return this.line_color.get_value()
  }

  get_line_alpha(): number {
    const css_alpha = this._get_css_value("line-alpha")
    if (css_alpha != "") {
      const alpha = Number(css_alpha)
      if (isFinite(alpha)) {
        return alpha
      }
    }
    return this.line_alpha.get_value()
  }

  get_line_width(): number {
    const css_width = this._get_css_value("line-width")
    if (css_width != "") {
      const width = Number(css_width)
      if (isFinite(width)) {
        return width
      }
    }
    return this.line_width.get_value()
  }

  get_line_join(): LineJoin {
    const css_join = this._get_css_value("line-join")
    if (LineJoin.valid(css_join)) {
      return css_join
    }
    return this.line_join.get_value()
  }

  get_line_cap(): LineCap {
    const css_cap = this._get_css_value("line-cap")
    if (LineCap.valid(css_cap)) {
      return css_cap
    }
    return this.line_cap.get_value()
  }

  get_line_dash(): LineDash | number[] {
    const css_dash = this._get_css_value("line-dash")
    if (LineDash.valid(css_dash)) {
      return css_dash
    }
    return this.line_dash.get_value()
  }

  get_line_dash_offset(): number {
    const css_dash_offset = this._get_css_value("line-dash-offset")
    if (css_dash_offset != "") {
      const dash_offset = Number(css_dash_offset)
      if (isFinite(dash_offset)) {
        return dash_offset
      }
    }
    return this.line_dash_offset.get_value()
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

  apply(ctx: Context2d, path?: Path2D): boolean {
    const {doit} = this
    if (doit) {
      this.set_value(ctx)
      if (path != null) {
        ctx.stroke(path)
      } else {
        ctx.stroke()
      }
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
    if (line_color.is_Scalar() && line_color.value == 0) {
      return false
    }
    const {line_alpha} = this
    if (line_alpha.is_Scalar() && line_alpha.value == 0) {
      return false
    }
    const {line_width} = this
    if (line_width.is_Scalar() && line_width.value == 0) {
      return false
    }
    return true
  }

  v_doit(i: number): boolean {
    if (this.line_color.get(i) == 0) {
      return false
    }
    if (this.line_alpha.get(i) == 0) {
      return false
    }
    if (this.line_width.get(i) == 0) {
      return false
    }
    return true
  }

  apply(ctx: Context2d, i: number, path?: Path2D): boolean {
    const doit = this.v_doit(i)
    if (doit) {
      this.set_vectorize(ctx, i)
      if (path != null) {
        ctx.stroke(path)
      } else {
        ctx.stroke()
      }
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
