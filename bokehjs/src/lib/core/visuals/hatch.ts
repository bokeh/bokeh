import {VisualProperties, VisualUniforms} from "./visual"
import {get_pattern} from "./patterns"
import {Color, uint32} from "../types"
import * as p from "../properties"
import * as mixins from "../property_mixins"
import {Context2d} from "../util/canvas"

export class Hatch extends VisualProperties {
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

export class HatchScalar extends VisualUniforms {
  readonly hatch_color: p.UniformScalar<uint32>
  readonly hatch_alpha: p.UniformScalar<number>
  readonly hatch_scale: p.UniformScalar<number>
  readonly hatch_pattern: p.UniformScalar<string>
  readonly hatch_weight: p.UniformScalar<number>
  readonly hatch_extra: p.UniformScalar<mixins.HatchExtra>

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
    const textures = this.hatch_extra.value

    const texture = textures[pattern]
    if (texture != null)
      return texture.get_pattern(color, alpha, scale, weight)
    else
      return get_pattern(pattern, color, alpha, scale, weight)
  }
}

export class HatchVector extends VisualUniforms {
  readonly hatch_color: p.Uniform<uint32>
  readonly hatch_alpha: p.Uniform<number>
  readonly hatch_scale: p.Uniform<number>
  readonly hatch_pattern: p.Uniform<string>
  readonly hatch_weight: p.Uniform<number>
  readonly hatch_extra: p.UniformScalar<mixins.HatchExtra>

  get doit(): boolean {
    const {hatch_color} = this
    if (hatch_color.is_Scalar() && hatch_color.value == 0)
      return false
    const {hatch_alpha} = this
    if (hatch_alpha.is_Scalar() && hatch_alpha.value == 0)
      return false
    const {hatch_pattern} = this
    if (hatch_pattern.is_Scalar()) {
      const pattern = hatch_pattern.value
      if (pattern == " " || pattern == "blank" || pattern == null)
        return false
    }
    return true
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
    const textures = this.hatch_extra.get(i)

    const texture = textures[pattern]
    if (texture != null)
      return texture.get_pattern(color, alpha, scale, weight)
    else
      return get_pattern(pattern, color, alpha, scale, weight)
  }
}

Hatch.prototype.type = "hatch"
Hatch.prototype.attrs = Object.keys(mixins.Hatch)

HatchScalar.prototype.type = "hatch"
HatchScalar.prototype.attrs = Object.keys(mixins.HatchScalar)

HatchVector.prototype.type = "hatch"
HatchVector.prototype.attrs = Object.keys(mixins.HatchVector)
