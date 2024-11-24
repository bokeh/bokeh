import {VisualProperties, VisualUniforms} from "./visual"
import {get_pattern} from "./patterns"
import type {Color, uint32} from "../types"
import * as p from "../properties"
import * as mixins from "../property_mixins"
import type {HatchPattern} from "../property_mixins"
import type {Context2d, CanvasPatternRepetition} from "../util/canvas"
import {dict} from "../util/object"

export interface Hatch extends Readonly<mixins.Hatch> {}
export class Hatch extends VisualProperties {
  protected _hatch_image: CanvasImageSource | null
  protected _update_iteration: number = 0

  override update(): void {
    this._update_iteration++
    this._hatch_image = null

    if (!this.doit) {
      return
    }

    const color = this.get_hatch_color()!
    const alpha = this.get_hatch_alpha()
    const scale = this.get_hatch_scale()
    const pattern = this.get_hatch_pattern()!
    const weight = this.get_hatch_weight()

    const finalize = (image: CanvasImageSource) => {
      this._hatch_image = image
    }

    const textures = dict(this.get_hatch_extra())
    const texture = textures.get(pattern)

    if (texture != null) {
      const image = texture.get_pattern(color, alpha, scale, weight)
      if (image instanceof Promise) {
        const {_update_iteration} = this
        void image.then((image) => {
          if (this._update_iteration == _update_iteration) {
            finalize(image)
            this.obj.request_paint()
          }
        })
      } else {
        finalize(image)
      }
    } else {
      const layer = this.obj.canvas.create_layer()
      const image = get_pattern(layer, pattern, color, alpha, scale, weight)
      finalize(image)
    }
  }

  get doit(): boolean {
    const color = this.get_hatch_color()
    const alpha = this.get_hatch_alpha()
    const pattern = this.get_hatch_pattern()

    return !(color == null || alpha == 0 || pattern == " " || pattern == "blank" || pattern == null)
  }

  apply(ctx: Context2d, path?: Path2D, rule: CanvasFillRule = "nonzero"): boolean {
    const {doit} = this
    if (doit) {
      this.set_value(ctx)
      ctx.layer.undo_transform(() => {
        if (path != null) {
          ctx.fill(path, rule)
        } else {
          ctx.fill(rule)
        }
      })
    }
    return doit
  }

  set_value(ctx: Context2d): void {
    const pattern = this.pattern(ctx)
    ctx.fillStyle = pattern ?? "transparent"
  }

  pattern(ctx: Context2d): CanvasPattern | null {
    const image = this._hatch_image
    if (image == null) {
      return null
    } else {
      return ctx.createPattern(image, this.repetition())
    }
  }

  repetition(): CanvasPatternRepetition {
    const pattern = this.get_hatch_pattern()!

    const textures = dict(this.get_hatch_extra())
    const texture = textures.get(pattern)

    if (texture == null) {
      return "repeat"
    } else {
      switch (texture.repetition) {
        case "repeat":    return "repeat"
        case "repeat_x":  return "repeat-x"
        case "repeat_y":  return "repeat-y"
        case "no_repeat": return "no-repeat"
      }
    }
  }

  get_hatch_color(): Color | null {
    const css_color = this._get_css_value("hatch-color")
    if (css_color != "") {
      return css_color
    }
    return this.hatch_color.get_value()
  }

  get_hatch_alpha(): number {
    const css_alpha = this._get_css_value("hatch-alpha")
    if (css_alpha != "") {
      const alpha = Number(css_alpha)
      if (isFinite(alpha)) {
        return alpha
      }
    }
    return this.hatch_alpha.get_value()
  }

  get_hatch_scale(): number {
    const css_scale = this._get_css_value("hatch-scale")
    if (css_scale != "") {
      const scale = Number(css_scale)
      if (isFinite(scale)) {
        return scale
      }
    }
    return this.hatch_scale.get_value()
  }

  get_hatch_pattern(): string | null {
    const css_pattern = this._get_css_value("hatch-pattern")
    if (css_pattern != "") {
      if (css_pattern == "none") {
        return null
      } else {
        return css_pattern
      }
    }
    return this.hatch_pattern.get_value()
  }

  get_hatch_weight(): number {
    const css_weight = this._get_css_value("hatch-weight")
    if (css_weight != "") {
      const weight = Number(css_weight)
      if (isFinite(weight)) {
        return weight
      }
    }
    return this.hatch_weight.get_value()
  }

  get_hatch_extra(): mixins.HatchExtra {
    return this.hatch_extra.get_value()
  }
}

export class HatchScalar extends VisualUniforms {
  declare readonly hatch_color: p.UniformScalar<uint32>
  declare readonly hatch_alpha: p.UniformScalar<number>
  declare readonly hatch_scale: p.UniformScalar<number>
  declare readonly hatch_pattern: p.UniformScalar<string | null>
  declare readonly hatch_weight: p.UniformScalar<number>
  declare readonly hatch_extra: p.UniformScalar<mixins.HatchExtra>

  protected _hatch_image: p.UniformScalar<CanvasImageSource | null>

  protected _static_doit: boolean = false

  protected _compute_static_doit(): boolean {
    const color = this.hatch_color.value
    const alpha = this.hatch_alpha.value
    const pattern = this.hatch_pattern.value

    return !(color == 0 || alpha == 0 || pattern == " " || pattern == "blank" || pattern == null)
  }

  protected _update_iteration: number = 0

  override update(): void {
    this._update_iteration++

    const n = this.hatch_color.length
    this._hatch_image = new p.UniformScalar(null, n)

    this._static_doit = this._compute_static_doit()
    if (!this._static_doit) {
      return
    }

    const color = this.hatch_color.value
    const alpha = this.hatch_alpha.value
    const scale = this.hatch_scale.value
    const pattern = this.hatch_pattern.value!
    const weight = this.hatch_weight.value

    const finalize = (image: CanvasImageSource) => {
      this._hatch_image = new p.UniformScalar(image, n)
    }

    const textures = dict(this.hatch_extra.value)
    const texture = textures.get(pattern)

    if (texture != null) {
      const image = texture.get_pattern(color, alpha, scale, weight)
      if (image instanceof Promise) {
        const {_update_iteration} = this
        void image.then((image) => {
          if (this._update_iteration == _update_iteration) {
            finalize(image)
            this.obj.request_paint()
          }
        })
      } else {
        finalize(image)
      }
    } else {
      const layer = this.obj.canvas.create_layer()
      const image = get_pattern(layer, pattern, color, alpha, scale, weight)
      finalize(image)
    }
  }

  get doit(): boolean {
    return this._static_doit
  }

  apply(ctx: Context2d, path?: Path2D, rule: CanvasFillRule = "nonzero"): boolean {
    const {doit} = this
    if (doit) {
      this.set_value(ctx)
      ctx.layer.undo_transform(() => {
        if (path != null) {
          ctx.fill(path, rule)
        } else {
          ctx.fill(rule)
        }
      })
    }
    return doit
  }

  set_value(ctx: Context2d): void {
    ctx.fillStyle = this.pattern(ctx) ?? "transparent"
  }

  pattern(ctx: Context2d): CanvasPattern | null {
    const image = this._hatch_image.value
    if (image == null) {
      return null
    } else {
      return ctx.createPattern(image, this.repetition())
    }
  }

  repetition(): CanvasPatternRepetition {
    const pattern = this.hatch_pattern.value
    if (pattern != null) {
      const textures = dict(this.hatch_extra.value)
      const texture = textures.get(pattern)
      if (texture != null) {
        switch (texture.repetition) {
          case "repeat":    return "repeat"
          case "repeat_x":  return "repeat-x"
          case "repeat_y":  return "repeat-y"
          case "no_repeat": return "no-repeat"
        }
      }
    }
    return "repeat"
  }
}

export class HatchVector extends VisualUniforms {
  declare readonly hatch_color: p.Uniform<uint32>
  declare readonly hatch_alpha: p.Uniform<number>
  declare readonly hatch_scale: p.Uniform<number>
  declare readonly hatch_pattern: p.Uniform<string | null>
  declare readonly hatch_weight: p.Uniform<number>
  declare readonly hatch_extra: p.UniformScalar<mixins.HatchExtra>

  protected _hatch_image: p.Uniform<CanvasImageSource | null>

  protected _static_doit: boolean = false

  protected _compute_static_doit(): boolean {
    const {hatch_color} = this
    if (hatch_color.is_Scalar() && hatch_color.value == 0) {
      return false
    }
    const {hatch_alpha} = this
    if (hatch_alpha.is_Scalar() && hatch_alpha.value == 0) {
      return false
    }
    const {hatch_pattern} = this
    if (hatch_pattern.is_Scalar()) {
      const pattern = hatch_pattern.value
      if (pattern == " " || pattern == "blank" || pattern == null) {
        return false
      }
    }
    return true
  }

  protected _update_iteration: number = 0

  override update(): void {
    this._update_iteration++

    const n = this.hatch_color.length
    this._hatch_image = new p.UniformScalar(null, n)

    this._static_doit = this._compute_static_doit()
    if (!this._static_doit) {
      return
    }

    const resolve_image = (pattern: HatchPattern, color: Color, alpha: number, scale: number, weight: number,
        finalize: (image: CanvasImageSource) => void) => {
      const textures = dict(this.hatch_extra.value)
      const texture = textures.get(pattern)

      if (texture != null) {
        const image = texture.get_pattern(color, alpha, scale, weight)
        if (image instanceof Promise) {
          const {_update_iteration} = this
          void image.then((image) => {
            if (this._update_iteration == _update_iteration) {
              finalize(image)
              this.obj.request_paint()
            }
          })
        } else {
          finalize(image)
        }
      } else {
        const layer = this.obj.canvas.create_layer()
        const image = get_pattern(layer, pattern, color, alpha, scale, weight)
        finalize(image)
      }
    }

    if (this.hatch_color.is_Scalar() &&
        this.hatch_alpha.is_Scalar() &&
        this.hatch_scale.is_Scalar() &&
        this.hatch_pattern.is_Scalar() &&
        this.hatch_weight.is_Scalar()) {

      const color = this.hatch_color.value
      const alpha = this.hatch_alpha.value
      const scale = this.hatch_scale.value
      const pattern = this.hatch_pattern.value!
      const weight = this.hatch_weight.value

      resolve_image(pattern, color, alpha, scale, weight, (image) => {
        this._hatch_image = new p.UniformScalar(image, n)
      })
    } else {
      const images = new Array(n)
      images.fill(null)

      this._hatch_image = new p.UniformVector(images)

      for (let i = 0; i < n; i++) {
        const color = this.hatch_color.get(i)
        const alpha = this.hatch_alpha.get(i)
        const scale = this.hatch_scale.get(i)
        const pattern = this.hatch_pattern.get(i)!
        const weight = this.hatch_weight.get(i)

        resolve_image(pattern, color, alpha, scale, weight, (image) => {
          images[i] = image
        })
      }
    }
  }

  get doit(): boolean {
    return this._static_doit
  }

  v_doit(i: number): boolean {
    if (!this.doit) {
      return false
    }
    if (this.hatch_color.get(i) == 0) {
      return false
    }
    if (this.hatch_alpha.get(i) == 0) {
      return false
    }
    const pattern = this.hatch_pattern.get(i)
    if (pattern == " " || pattern == "blank" || pattern == null) {
      return false
    }
    return true
  }

  apply(ctx: Context2d, i: number, path?: Path2D, rule: CanvasFillRule = "nonzero"): boolean {
    const doit = this.v_doit(i)
    if (doit) {
      this.set_vectorize(ctx, i)
      ctx.layer.undo_transform(() => {
        if (path != null) {
          ctx.fill(path, rule)
        } else {
          ctx.fill(rule)
        }
      })
    }
    return doit
  }

  set_vectorize(ctx: Context2d, i: number): void {
    ctx.fillStyle = this.pattern(ctx, i) ?? "transparent"
  }

  pattern(ctx: Context2d, i: number): CanvasPattern | null {
    const image = this._hatch_image.get(i)
    if (image == null) {
      return null
    } else {
      return ctx.createPattern(image, this.repetition(i))
    }
  }

  repetition(i: number): CanvasPatternRepetition {
    const pattern = this.hatch_pattern.get(i)
    if (pattern != null) {
      const textures = dict(this.hatch_extra.value)
      const texture = textures.get(pattern)
      if (texture != null) {
        switch (texture.repetition) {
          case "repeat":    return "repeat"
          case "repeat_x":  return "repeat-x"
          case "repeat_y":  return "repeat-y"
          case "no_repeat": return "no-repeat"
        }
      }
    }
    return "repeat"
  }
}

Hatch.prototype.type = "hatch"
Hatch.prototype.attrs = Object.keys(mixins.Hatch)

HatchScalar.prototype.type = "hatch"
HatchScalar.prototype.attrs = Object.keys(mixins.HatchScalar)

HatchVector.prototype.type = "hatch"
HatchVector.prototype.attrs = Object.keys(mixins.HatchVector)
