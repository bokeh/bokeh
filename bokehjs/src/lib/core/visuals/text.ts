import type {ValuesOf, Paintable} from "./visual"
import {VisualProperties, VisualUniforms} from "./visual"
import type {uint32} from "../types"
import type * as p from "../properties"
import * as mixins from "../property_mixins"
import type {FontStyle, TextAlign, TextBaseline} from "../enums"
import {color2css} from "../util/color"
import type {Context2d} from "../util/canvas"

const _font_cache: Map<string, WeakSet<Paintable>> = new Map()

function load_font(font: string, obj: Paintable): void {
  const objs = _font_cache.get(font)
  if (objs == null) {
    const objs = new WeakSet([obj])
    _font_cache.set(font, objs)
  } else if (!objs.has(obj)) {
    objs.add(obj)
  } else {
    return
  }

  const {fonts} = document
  if (!fonts.check(font)) {
    void fonts.load(font).then(() => obj.request_paint())
  }
}

export interface Text extends Readonly<mixins.Text> {}
export class Text extends VisualProperties {
  get doit(): boolean {
    const color = this.text_color.get_value()
    const alpha = this.text_alpha.get_value()

    return !(color == null || alpha == 0)
  }

  override update(): void {
    if (!this.doit) {
      return
    }

    const font = this.font_value()
    load_font(font, this.obj)
  }

  declare Values: ValuesOf<mixins.Text>
  values(): this["Values"] {
    return {
      color:         this.text_color.get_value(),
      outline_color: this.text_outline_color.get_value(),
      alpha:         this.text_alpha.get_value(),
      font:          this.text_font.get_value(),
      font_size:     this.text_font_size.get_value(),
      font_style:    this.text_font_style.get_value(),
      align:         this.text_align.get_value(),
      baseline:      this.text_baseline.get_value(),
      line_height:   this.text_line_height.get_value(),
    }
  }

  set_value(ctx: Context2d): void {
    const color = this.text_color.get_value()
    const outline_color = this.text_outline_color.get_value()
    const alpha = this.text_alpha.get_value()

    ctx.fillStyle    = color2css(color, alpha)
    ctx.strokeStyle  = color2css(outline_color, alpha)
    ctx.font         = this.font_value()
    ctx.textAlign    = this.text_align.get_value()
    ctx.textBaseline = this.text_baseline.get_value()
  }

  font_value(): string {
    const style = this.text_font_style.get_value()
    const size = this.text_font_size.get_value()
    const face = this.text_font.get_value()
    return `${style} ${size} ${face}`
  }
}

export class TextScalar extends VisualUniforms {
  declare readonly text_color:         p.UniformScalar<uint32>
  declare readonly text_outline_color: p.UniformScalar<uint32>
  declare readonly text_alpha:         p.UniformScalar<number>
  declare readonly text_font:          p.UniformScalar<string>
  declare readonly text_font_size:     p.UniformScalar<string>
  declare readonly text_font_style:    p.UniformScalar<FontStyle>
  declare readonly text_align:         p.UniformScalar<TextAlign>
  declare readonly text_baseline:      p.UniformScalar<TextBaseline>
  declare readonly text_line_height:   p.UniformScalar<number>

  get doit(): boolean {
    const color = this.text_color.value
    const alpha = this.text_alpha.value

    return !(color == 0 || alpha == 0)
  }

  override update(): void {
    if (!this.doit) {
      return
    }

    const font = this.font_value()
    load_font(font, this.obj)
  }

  declare Values: ValuesOf<mixins.Text>
  values(): this["Values"] {
    return {
      color:         this.text_color.value,
      outline_color: this.text_outline_color.value,
      alpha:         this.text_alpha.value,
      font:          this.text_font.value,
      font_size:     this.text_font_size.value,
      font_style:    this.text_font_style.value,
      align:         this.text_align.value,
      baseline:      this.text_baseline.value,
      line_height:   this.text_line_height.value,
    }
  }

  set_value(ctx: Context2d): void {
    const color = this.text_color.value
    const alpha = this.text_alpha.value
    const outline_color = this.text_outline_color.value
    const font = this.font_value()
    const align = this.text_align.value
    const baseline = this.text_baseline.value

    ctx.fillStyle = color2css(color, alpha)
    ctx.strokeStyle = color2css(outline_color, alpha)
    ctx.font = font
    ctx.textAlign = align
    ctx.textBaseline = baseline
  }

  font_value(): string {
    const style = this.text_font_style.value
    const size = this.text_font_size.value
    const face = this.text_font.value
    return `${style} ${size} ${face}`
  }
}

export class TextVector extends VisualUniforms {
  declare readonly text_color:         p.Uniform<uint32>
  declare readonly text_outline_color: p.Uniform<uint32>
  declare readonly text_alpha:         p.Uniform<number>
  declare readonly text_font:          p.Uniform<string>
  declare readonly text_font_size:     p.Uniform<string>
  declare readonly text_font_style:    p.Uniform<FontStyle>
  declare readonly text_align:         p.Uniform<TextAlign>
  declare readonly text_baseline:      p.Uniform<TextBaseline>
  declare readonly text_line_height:   p.Uniform<number>

  private _assert_font(i: number): void {
    const font = this.font_value(i)
    load_font(font, this.obj)
  }

  declare Values: ValuesOf<mixins.Text>
  values(i: number): this["Values"] {
    this._assert_font(i)
    return {
      color:         this.text_color.get(i),
      outline_color: this.text_outline_color.get(i),
      alpha:         this.text_alpha.get(i),
      font:          this.text_font.get(i),
      font_size:     this.text_font_size.get(i),
      font_style:    this.text_font_style.get(i),
      align:         this.text_align.get(i),
      baseline:      this.text_baseline.get(i),
      line_height:   this.text_line_height.get(i),
    }
  }

  get doit(): boolean {
    const {text_color} = this
    if (text_color.is_Scalar() && text_color.value == 0) {
      return false
    }
    const {text_alpha} = this
    if (text_alpha.is_Scalar() && text_alpha.value == 0) {
      return false
    }
    return true
  }

  v_doit(i: number): boolean {
    if (this.text_color.get(i) == 0) {
      return false
    }
    if (this.text_alpha.get(i) == 0) {
      return false
    }
    return true
  }

  apply(ctx: Context2d, i: number): boolean {
    const doit = this.v_doit(i)
    if (doit) {
      this.set_vectorize(ctx, i)
    }
    return doit
  }

  set_vectorize(ctx: Context2d, i: number): void {
    this._assert_font(i)

    const color = this.text_color.get(i)
    const outline_color = this.text_outline_color.get(i)
    const alpha = this.text_alpha.get(i)
    const font = this.font_value(i)
    const align = this.text_align.get(i)
    const baseline = this.text_baseline.get(i)

    ctx.fillStyle = color2css(color, alpha)
    ctx.strokeStyle = color2css(outline_color, alpha)
    ctx.font = font
    ctx.textAlign = align
    ctx.textBaseline = baseline
  }

  font_value(i: number): string {
    const style = this.text_font_style.get(i)
    const size = this.text_font_size.get(i)
    const face = this.text_font.get(i)
    return `${style} ${size} ${face}`
  }
}

Text.prototype.type = "text"
Text.prototype.attrs = Object.keys(mixins.Text)

TextScalar.prototype.type = "text"
TextScalar.prototype.attrs = Object.keys(mixins.TextScalar)

TextVector.prototype.type = "text"
TextVector.prototype.attrs = Object.keys(mixins.TextVector)
