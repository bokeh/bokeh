import {VisualProperties} from "./visual"
import * as p from "../properties"
import * as mixins from "../property_mixins"
import {FontStyle, TextAlign, TextBaseline} from "../enums"
import {color2css} from "../util/color"
import {Context2d} from "../util/canvas"

class _Text extends VisualProperties {
  name = "text"

  readonly text_font:        p.Font
  readonly text_font_size:   p.StringSpec
  readonly text_font_style:  p.Property<FontStyle>
  readonly text_color:       p.ColorSpec
  readonly text_alpha:       p.NumberSpec
  readonly text_align:       p.Property<TextAlign>
  readonly text_baseline:    p.Property<TextBaseline>
  readonly text_line_height: p.Number

  color_value(): string {
    return color2css(this.text_color.value(), this.text_alpha.value())
  }

  font_value(): string {
    const style = this.text_font_style.value()
    const size = this.text_font_size.value()
    const face = this.text_font.value()
    return `${style} ${size} ${face}`
  }

  v_font_value(i: number): string {
    const style = super.cache_select(this.text_font_style, i)
    const size = super.cache_select(this.text_font_size, i)
    const face = super.cache_select(this.text_font, i)
    return `${style} ${size} ${face}`
  }

  get doit(): boolean {
    return !(this.text_color.spec.value === null ||
             this.text_alpha.spec.value == 0)
  }

  protected _set_value(ctx: Context2d): void {
    const color = this.text_color.value()
    const alpha = this.text_alpha.value()

    ctx.fillStyle    = color2css(color, alpha)
    ctx.font         = this.font_value()
    ctx.textAlign    = this.text_align.value()
    ctx.textBaseline = this.text_baseline.value()
  }

  protected _set_vectorize(ctx: Context2d, i: number): void {
    const color = this.cache_select(this.text_color, i)
    const alpha = this.cache_select(this.text_alpha, i)
    const font = this.v_font_value(i)
    const align = this.cache_select(this.text_align, i)
    const baseline = this.cache_select(this.text_baseline, i)

    ctx.fillStyle = color2css(color, alpha)
    ctx.font = font
    ctx.textAlign = align
    ctx.textBaseline = baseline
  }
}

_Text.prototype.attrs = Object.keys(mixins.TextVector)

export class Text extends _Text {
  set_value(ctx: Context2d): void {
    this._set_value(ctx)
  }
}
export class TextScalar extends Text {}
export class TextVector extends _Text {
  set_vectorize(ctx: Context2d, i: number): void {
    this._set_vectorize(ctx, i)
  }
}
