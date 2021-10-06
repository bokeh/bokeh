import {VisualProperties, VisualUniforms, ValuesOf} from "./visual"
import {uint32} from "../types"
import * as p from "../properties"
import * as mixins from "../property_mixins"
import {color2css} from "../util/color"
import {Context2d} from "../util/canvas"

export interface Fill extends Readonly<mixins.Fill> {}
export class Fill extends VisualProperties {
  get doit(): boolean {
    const color = this.fill_color.get_value()
    const alpha = this.fill_alpha.get_value()

    return !(color == null || alpha == 0)
  }

  apply(ctx: Context2d, rule?: CanvasFillRule): boolean {
    const {doit} = this
    if (doit) {
      this.set_value(ctx)
      ctx.fill(rule)
    }
    return doit
  }

  Values: ValuesOf<mixins.Fill>
  values(): this["Values"] {
    return {
      color: this.fill_color.get_value(),
      alpha: this.fill_alpha.get_value(),
    }
  }

  set_value(ctx: Context2d): void {
    const color = this.fill_color.get_value()
    const alpha = this.fill_alpha.get_value()

    ctx.fillStyle = color2css(color, alpha)
  }
}

export class FillScalar extends VisualUniforms {
  readonly fill_color: p.UniformScalar<uint32>
  readonly fill_alpha: p.UniformScalar<number>

  get doit(): boolean {
    const color = this.fill_color.value
    const alpha = this.fill_alpha.value

    return !(color == 0 || alpha == 0)
  }

  apply(ctx: Context2d, rule?: CanvasFillRule): boolean {
    const {doit} = this
    if (doit) {
      this.set_value(ctx)
      ctx.fill(rule)
    }
    return doit
  }

  Values: ValuesOf<mixins.Fill>
  values(): this["Values"] {
    return {
      color: this.fill_color.value,
      alpha: this.fill_alpha.value,
    }
  }

  set_value(ctx: Context2d): void {
    const color = this.fill_color.value
    const alpha = this.fill_alpha.value

    ctx.fillStyle = color2css(color, alpha)
  }
}

export class FillVector extends VisualUniforms {
  readonly fill_color: p.Uniform<uint32>
  readonly fill_alpha: p.Uniform<number>

  get doit(): boolean {
    const {fill_color} = this
    if (fill_color.is_Scalar() && fill_color.value == 0)
      return false
    const {fill_alpha} = this
    if (fill_alpha.is_Scalar() && fill_alpha.value == 0)
      return false
    return true
  }

  apply(ctx: Context2d, i: number, rule?: CanvasFillRule): boolean {
    const {doit} = this
    if (doit) {
      this.set_vectorize(ctx, i)
      ctx.fill(rule)
    }
    return doit
  }

  Values: ValuesOf<mixins.Fill>
  values(i: number): this["Values"] {
    return {
      color: this.fill_color.get(i),
      alpha: this.fill_alpha.get(i),
    }
  }

  set_vectorize(ctx: Context2d, i: number): void {
    const color = this.fill_color.get(i)
    const alpha = this.fill_alpha.get(i)

    ctx.fillStyle = color2css(color, alpha)
  }
}

Fill.prototype.type = "fill"
Fill.prototype.attrs = Object.keys(mixins.Fill)

FillScalar.prototype.type = "fill"
FillScalar.prototype.attrs = Object.keys(mixins.FillScalar)

FillVector.prototype.type = "fill"
FillVector.prototype.attrs = Object.keys(mixins.FillVector)
