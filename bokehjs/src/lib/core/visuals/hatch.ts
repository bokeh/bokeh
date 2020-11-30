import {VisualProperties} from "./visual"
import {get_pattern} from "./patterns"
import * as p from "../properties"
import * as mixins from "../property_mixins"
import {color2css} from "../util/color"
import {Context2d} from "../util/canvas"
import type {Texture} from "models/textures/texture"

const {hasOwnProperty} = Object.prototype

class _Hatch extends VisualProperties {
  name = "hatch"

  readonly hatch_color: p.ColorSpec
  readonly hatch_alpha: p.NumberSpec
  readonly hatch_scale: p.NumberSpec
  readonly hatch_pattern: p.StringSpec
  readonly hatch_weight: p.NumberSpec

  protected _try_defer(defer_func: () => void): void {
    const {hatch_pattern, hatch_extra} = this.cache
    if (hatch_extra != null && hasOwnProperty.call(hatch_extra, hatch_pattern)) {
      const custom = hatch_extra[hatch_pattern]
      custom.onload(defer_func)
    }
  }

  get doit(): boolean {
    return !(this.hatch_color.spec.value === null ||
             this.hatch_alpha.spec.value == 0 ||
             this.hatch_pattern.spec.value == " " ||
             this.hatch_pattern.spec.value == "blank" ||
             this.hatch_pattern.spec.value === null)
  }

  color_value(): string {
    return color2css(this.hatch_color.value(), this.hatch_alpha.value())
  }
}

_Hatch.prototype.attrs = Object.keys(mixins.HatchVector)

export class Hatch extends _Hatch {
  set_value(ctx: Context2d): void {
    const pattern = this.pattern()(ctx)
    ctx.fillStyle = pattern != null ? pattern : "" // XXX: deal with null
  }

  pattern(): (ctx: Context2d) => CanvasPattern | null {
    const color = this.hatch_color.value()
    const alpha = this.hatch_alpha.value()
    const scale = this.hatch_scale.value()
    const pattern = this.hatch_pattern.value()
    const weight = this.hatch_weight.value()

    const {hatch_extra} = this.cache
    if (hatch_extra != null && hasOwnProperty.call(hatch_extra, pattern))
      return (hatch_extra[pattern] as Texture).get_pattern(color, alpha, scale, weight)
    else
      return get_pattern(pattern, color, alpha, scale, weight)
  }

  doit2(ctx: Context2d, ready_func: () => void, defer_func: () => void): void {
    if (!this.doit)
      return

    const pattern = this.pattern()(ctx)
    if (pattern == null) {
      this._try_defer(defer_func)
    } else {
      this.set_value(ctx)
      ready_func()
    }
  }
}

export class HatchScalar extends Hatch {}

export class HatchVector extends _Hatch {
  set_vectorize(ctx: Context2d, i: number): void {
    const pattern = this.v_pattern(i)(ctx)
    ctx.fillStyle = pattern != null ? pattern : "" // XXX: deal with null
  }

  v_pattern(i: number): (ctx: Context2d) => CanvasPattern | null {
    const color = this.cache_select(this.hatch_color, i)
    const alpha = this.cache_select(this.hatch_alpha, i)
    const scale = this.cache_select(this.hatch_scale, i)
    const pattern = this.cache_select(this.hatch_pattern, i)
    const weight = this.cache_select(this.hatch_weight, i)

    const {hatch_extra} = this.cache
    if (hatch_extra != null && hasOwnProperty.call(hatch_extra, pattern))
      this.cache.pattern = (hatch_extra[pattern] as Texture).get_pattern(color, alpha, scale, weight)
    else
      this.cache.pattern = get_pattern(pattern, color, alpha, scale, weight)
    return this.cache.pattern
  }

  doit2(ctx: Context2d, i: number, ready_func: () => void, defer_func: () => void): void {
    if (!this.doit)
      return

    const pattern = this.v_pattern(i)(ctx)
    if (pattern == null) {
      this._try_defer(defer_func)
    } else {
      this.set_vectorize(ctx, i)
      ready_func()
    }
  }
}
