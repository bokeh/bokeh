import {VisualProperties} from "./visual"
import {get_pattern} from "./patterns"
import {Color} from "../types"
import * as p from "../properties"
import * as mixins from "../property_mixins"
import {RGBA} from "../util/color"
import {Context2d} from "../util/canvas"

abstract class _Hatch extends VisualProperties {
  name = "hatch"
}
_Hatch.prototype.attrs = Object.keys(mixins.HatchVector)

export class Hatch extends _Hatch {
  readonly hatch_color: p.Property<Color | null>
  readonly hatch_alpha: p.Property<number>
  readonly hatch_scale: p.Property<number>
  readonly hatch_pattern: p.Property<string>
  readonly hatch_weight: p.Property<number>
  readonly hatch_extra: p.Property<mixins.HatchExtra>

  get doit(): boolean {
    const color = this.hatch_color.get_value()
    const alpha = this.hatch_alpha.get_value()
    const pattern = this.hatch_pattern.get_value()

    return !(color == null || alpha == 0 || pattern == " " || pattern == "blank" || pattern == null)
  }

  set_value(ctx: Context2d): void {
    const pattern = this.pattern()(ctx)
    ctx.fillStyle = pattern != null ? pattern : "" // XXX: deal with null
  }

  pattern(): (ctx: Context2d) => CanvasPattern | null {
    const color = this.hatch_color.get_value()
    const alpha = this.hatch_alpha.get_value()
    const scale = this.hatch_scale.get_value()
    const pattern = this.hatch_pattern.get_value()
    const weight = this.hatch_weight.get_value()

    const textures = this.hatch_extra.get_value()
    const texture = textures[pattern]

    if (texture != null)
      return texture.get_pattern(color!, alpha, scale, weight)
    else
      return get_pattern(pattern, color!, alpha, scale, weight)
  }
}

export class HatchScalar extends _Hatch {
  readonly hatch_color: p.UniformScalar<RGBA>
  readonly hatch_alpha: p.UniformScalar<number>
  readonly hatch_scale: p.UniformScalar<number>
  readonly hatch_pattern: p.UniformScalar<string>
  readonly hatch_weight: p.UniformScalar<number>
  readonly hatch_extra: p.Property<mixins.HatchExtra>

  get doit(): boolean {
    const color = this.hatch_color.value
    const alpha = this.hatch_alpha.value
    const pattern = this.hatch_pattern.value

    return !(color == null || alpha == 0 || pattern == " " || pattern == "blank" || pattern == null)
  }

  set_value(ctx: Context2d): void {
    const pattern = this.pattern()(ctx)
    ctx.fillStyle = pattern != null ? pattern : "" // XXX: deal with null
  }

  pattern(): (ctx: Context2d) => CanvasPattern | null {
    const color = this.hatch_color.value
    const alpha = this.hatch_alpha.value
    const scale = this.hatch_scale.value
    const pattern = this.hatch_pattern.value
    const weight = this.hatch_weight.value

    const textures = this.hatch_extra.get_value()
    const texture = textures[pattern]

    if (texture != null)
      return texture.get_pattern(color, alpha, scale, weight)
    else
      return get_pattern(pattern, color, alpha, scale, weight)
  }
}

export class HatchVector extends _Hatch {
  readonly hatch_color: p.Uniform<RGBA>
  readonly hatch_alpha: p.Uniform<number>
  readonly hatch_scale: p.Uniform<number>
  readonly hatch_pattern: p.Uniform<string>
  readonly hatch_weight: p.Uniform<number>
  readonly hatch_extra: p.Property<mixins.HatchExtra>

  get doit(): boolean {
    const color = this.hatch_color.value
    const alpha = this.hatch_alpha.value
    const pattern = this.hatch_pattern.value

    return !(color == null || alpha == 0 || pattern == " " || pattern == "blank" || pattern == null)
  }

  set_vectorize(ctx: Context2d, i: number): void {
    const pattern = this.pattern(i)(ctx)
    ctx.fillStyle = pattern != null ? pattern : "" // XXX: deal with null
  }

  pattern(i: number): (ctx: Context2d) => CanvasPattern | null {
    const color = this.hatch_color.get(i)
    const alpha = this.hatch_alpha.get(i)
    const scale = this.hatch_scale.get(i)
    const pattern = this.hatch_pattern.get(i)
    const weight = this.hatch_weight.get(i)

    const textures = this.hatch_extra.get_value()
    const texture = textures[pattern]

    if (texture != null)
      return texture.get_pattern(color, alpha, scale, weight)
    else
      return get_pattern(pattern, color, alpha, scale, weight)
  }
}
