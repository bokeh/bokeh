import type {ValuesOf, Paintable} from "./visual"
import {VisualProperties, VisualUniforms} from "./visual"
import type {uint32, Color} from "../types"
import type * as p from "../properties"
import * as mixins from "../property_mixins"
import {FontStyle, TextAlign, TextBaseline} from "../enums"
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
    const color = this.get_text_color()
    const alpha = this.get_text_alpha()

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
  declare ComputedValues: {
    color:         string
    outline_color: string
    font:          string
    text_align:    TextAlign
    text_baseline: TextBaseline
    line_height:   number
  }

  values(): this["Values"] {
    return {
      color:         this.get_text_color(),
      outline_color: this.get_text_outline_color(),
      alpha:         this.get_text_alpha(),
      font:          this.get_text_font(),
      font_size:     this.get_text_font_size(),
      font_style:    this.get_text_font_style(),
      align:         this.get_text_align(),
      baseline:      this.get_text_baseline(),
      line_height:   this.get_text_line_height(),
    }
  }

  computed_values(): this["ComputedValues"] {
    const color = this.get_text_color()
    const outline_color = this.get_text_outline_color()
    const alpha = this.get_text_alpha()
    return {
      color:         color2css(color, alpha),
      outline_color: color2css(outline_color, alpha),
      font:          this.font_value(),
      text_align:    this.get_text_align(),
      text_baseline: this.get_text_baseline(),
      line_height:   this.get_text_line_height(),
    }
  }

  set_value(ctx: Context2d): void {
    const {
      color,
      outline_color,
      font,
      text_align,
      text_baseline,
    } = this.computed_values()

    ctx.fillStyle    = color
    ctx.strokeStyle  = outline_color
    ctx.font         = font
    ctx.textAlign    = text_align
    ctx.textBaseline = text_baseline
  }

  font_value(): string {
    const style = this.get_text_font_style()
    const size = this.get_text_font_size()
    const face = this.get_text_font()
    return `${style} ${size} ${face}`
  }

  get_text_color(): Color | null {
    const css_color = this._get_css_value("text-color")
    if (css_color != "") {
      return css_color
    }
    return this.text_color.get_value()
  }

  get_text_outline_color(): Color | null {
    const css_color = this._get_css_value("text-outline-color")
    if (css_color != "") {
      return css_color
    }
    return this.text_outline_color.get_value()
  }

  get_text_alpha(): number {
    const css_alpha = this._get_css_value("text-alpha")
    if (css_alpha != "") {
      const alpha = Number(css_alpha)
      if (isFinite(alpha)) {
        return alpha
      }
    }
    return this.text_alpha.get_value()
  }

  get_text_font(): string {
    const css_font = this._get_css_value("text-font")
    if (css_font != "") {
      return css_font
    }
    return this.text_font.get_value()
  }

  get_text_font_size(): string {
    const css_font_size = this._get_css_value("text-font-size")
    if (css_font_size != "") {
      return css_font_size
    }
    return this.text_font_size.get_value()
  }

  get_text_font_style(): FontStyle {
    const css_font_style = this._get_css_value("text-font-style")
    if (FontStyle.valid(css_font_style)) {
      return css_font_style
    }
    return this.text_font_style.get_value()
  }

  get_text_align(): TextAlign {
    const css_align = this._get_css_value("text-align")
    if (TextAlign.valid(css_align)) {
      return css_align
    }
    return this.text_align.get_value()
  }

  get_text_baseline(): TextBaseline {
    const css_baseline = this._get_css_value("text-baseline")
    if (TextBaseline.valid(css_baseline)) {
      return css_baseline
    }
    return this.text_baseline.get_value()
  }

  get_text_line_height(): number {
    const css_line_height = this._get_css_value("line-height")
    if (css_line_height != "") {
      const line_height = Number(css_line_height)
      if (isFinite(line_height)) {
        return line_height
      }
    }
    return this.text_line_height.get_value()
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
