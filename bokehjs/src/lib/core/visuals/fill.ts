import {VisualProperties} from "./visual"
import * as p from "../properties"
import * as mixins from "../property_mixins"
import {color2css} from "../util/color"
import {Context2d} from "../util/canvas"

class _Fill extends VisualProperties {
  name = "fill"

  readonly fill_color: p.ColorSpec
  readonly fill_alpha: p.NumberSpec

  get doit(): boolean {
    return !(this.fill_color.spec.value === null ||
             this.fill_alpha.spec.value == 0)
  }

  protected _set_value(ctx: Context2d): void {
    const color = this.fill_color.value()
    const alpha = this.fill_alpha.value()

    ctx.fillStyle = color2css(color, alpha)
  }

  protected _set_vectorize(ctx: Context2d, i: number): void {
    const color = this.cache_select(this.fill_color, i)
    const alpha = this.cache_select(this.fill_alpha, i)

    ctx.fillStyle = color2css(color, alpha)
  }

  color_value(): string {
    return color2css(this.fill_color.value(), this.fill_alpha.value())
  }
}

_Fill.prototype.attrs = Object.keys(mixins.FillVector)

export class Fill extends _Fill {
  set_value(ctx: Context2d): void {
    this._set_value(ctx)
  }
}
export class FillScalar extends Fill {}
export class FillVector extends _Fill {
  set_vectorize(ctx: Context2d, i: number): void {
    this._set_vectorize(ctx, i)
  }
}
