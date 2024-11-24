import type {ValuesOf} from "./visual"
import {VisualProperties, VisualUniforms} from "./visual"
import type {uint32, Color} from "../types"
import type * as p from "../properties"
import * as mixins from "../property_mixins"
import {color2css} from "../util/color"
import type {Context2d} from "../util/canvas"

export interface Fill extends Readonly<mixins.Fill> {}
export class Fill extends VisualProperties {
  get doit(): boolean {
    const color = this.get_fill_color()
    const alpha = this.get_fill_alpha()

    return !(color == null || alpha == 0)
  }

  apply(ctx: Context2d, path?: Path2D, rule: CanvasFillRule = "nonzero"): boolean {
    const {doit} = this
    if (doit) {
      this.set_value(ctx)
      if (path != null) {
        ctx.fill(path, rule)
      } else {
        ctx.fill(rule)
      }
    }
    return doit
  }

  declare Values: ValuesOf<mixins.Fill>
  declare ComputedValues: {
    color: string
  }

  values(): this["Values"] {
    return {
      color: this.get_fill_color(),
      alpha: this.get_fill_alpha(),
    }
  }

  computed_values(): this["ComputedValues"] {
    const color = this.get_fill_color()
    const alpha = this.get_fill_alpha()
    return {
      color: color2css(color, alpha),
    }
  }

  set_value(ctx: Context2d): void {
    const {color} = this.computed_values()
    ctx.fillStyle = color
  }

  get_fill_color(): Color | null {
    const css_color = this._get_css_value("fill-color")
    if (css_color != "") {
      return css_color
    }
    return this.fill_color.get_value()
  }

  get_fill_alpha(): number {
    const css_alpha = this._get_css_value("fill-alpha")
    if (css_alpha != "") {
      const alpha = Number(css_alpha)
      if (isFinite(alpha)) {
        return alpha
      }
    }
    return this.fill_alpha.get_value()
  }
}

export class FillScalar extends VisualUniforms {
  declare readonly fill_color: p.UniformScalar<uint32>
  declare readonly fill_alpha: p.UniformScalar<number>

  get doit(): boolean {
    const color = this.fill_color.value
    const alpha = this.fill_alpha.value

    return !(color == 0 || alpha == 0)
  }

  apply(ctx: Context2d, path?: Path2D, rule: CanvasFillRule = "nonzero"): boolean {
    const {doit} = this
    if (doit) {
      this.set_value(ctx)
      if (path != null) {
        ctx.fill(path, rule)
      } else {
        ctx.fill(rule)
      }
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
  declare readonly fill_color: p.Uniform<uint32>
  declare readonly fill_alpha: p.Uniform<number>

  get doit(): boolean {
    const {fill_color} = this
    if (fill_color.is_Scalar() && fill_color.value == 0) {
      return false
    }
    const {fill_alpha} = this
    if (fill_alpha.is_Scalar() && fill_alpha.value == 0) {
      return false
    }
    return true
  }

  v_doit(i: number): boolean {
    if (this.fill_color.get(i) == 0) {
      return false
    }
    if (this.fill_alpha.get(i) == 0) {
      return false
    }
    return true
  }

  apply(ctx: Context2d, i: number, path?: Path2D, rule: CanvasFillRule = "nonzero"): boolean {
    const doit = this.v_doit(i)
    if (doit) {
      this.set_vectorize(ctx, i)
      if (path != null) {
        ctx.fill(path, rule)
      } else {
        ctx.fill(rule)
      }
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
