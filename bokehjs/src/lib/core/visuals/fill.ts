import {VisualProperties, VisualUniforms} from "./visual"
import {Color, uint32} from "../types"
import * as p from "../properties"
import * as mixins from "../property_mixins"
import {color2css} from "../util/color"
import {Context2d} from "../util/canvas"

export class Fill extends VisualProperties {
  readonly fill_color: p.Property<Color | null>
  readonly fill_alpha: p.Property<number>

  get doit(): boolean {
    const color = this.fill_color.get_value()
    const alpha = this.fill_alpha.get_value()

    return !(color == null || alpha == 0)
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
