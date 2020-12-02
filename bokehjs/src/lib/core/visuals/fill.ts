import {VisualProperties} from "./visual"
import {Color} from "../types"
import * as p from "../properties"
import * as mixins from "../property_mixins"
import {color2css, RGBA} from "../util/color"
import {Context2d} from "../util/canvas"

abstract class _Fill extends VisualProperties {
  name = "fill"
}
_Fill.prototype.attrs = Object.keys(mixins.FillVector)

export class Fill extends _Fill {
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

export class FillScalar extends _Fill {
  readonly fill_color: p.UniformScalar<RGBA>
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

export class FillVector extends _Fill {
  readonly fill_color: p.Uniform<RGBA>
  readonly fill_alpha: p.Uniform<number>

  get doit(): boolean {
    const {fill_color} = this
    if (p.is_UniformScalar(fill_color) && fill_color.value == 0)
      return false
    const {fill_alpha} = this
    if (p.is_UniformScalar(fill_alpha) && fill_alpha.value == 0)
      return false
    return true
  }

  set_vectorize(ctx: Context2d, i: number): void {
    const color = this.fill_color.get(i)
    const alpha = this.fill_alpha.get(i)

    ctx.fillStyle = color2css(color, alpha)
  }
}
