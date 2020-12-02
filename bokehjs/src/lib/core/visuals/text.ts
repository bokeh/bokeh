import {VisualProperties} from "./visual"
import {Color} from "../types"
import * as p from "../properties"
import * as mixins from "../property_mixins"
import {FontStyle, TextAlign, TextBaseline} from "../enums"
import {color2css, RGBA} from "../util/color"
import {Context2d} from "../util/canvas"

abstract class _Text extends VisualProperties {
  name = "text"
}
_Text.prototype.attrs = Object.keys(mixins.TextVector)

export class Text extends _Text {
  readonly text_font:        p.Property<string>
  readonly text_font_size:   p.Property<String>
  readonly text_font_style:  p.Property<FontStyle>
  readonly text_color:       p.Property<Color | null>
  readonly text_alpha:       p.Property<number>
  readonly text_align:       p.Property<TextAlign>
  readonly text_baseline:    p.Property<TextBaseline>
  readonly text_line_height: p.Property<number>

  get doit(): boolean {
    const color = this.text_color.get_value()
    const alpha = this.text_alpha.get_value()

    return !(color == null || alpha == 0)
  }

  set_value(ctx: Context2d): void {
    const color = this.text_color.get_value()
    const alpha = this.text_alpha.get_value()

    ctx.fillStyle    = color2css(color, alpha)
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

export class TextScalar extends _Text {
  readonly text_color:       p.UniformScalar<RGBA>
  readonly text_alpha:       p.UniformScalar<number>
  readonly text_font:        p.UniformScalar<string>
  readonly text_font_size:   p.UniformScalar<string>
  readonly text_font_style:  p.UniformScalar<FontStyle>
  readonly text_align:       p.UniformScalar<TextAlign>
  readonly text_baseline:    p.UniformScalar<TextBaseline>
  readonly text_line_height: p.UniformScalar<number>

  get doit(): boolean {
    const color = this.text_color.value
    const alpha = this.text_alpha.value

    return !(color == 0 || alpha == 0)
  }

  set_value(ctx: Context2d): void {
    const color = this.text_color.value
    const alpha = this.text_alpha.value
    const font = this.font_value()
    const align = this.text_align.value
    const baseline = this.text_baseline.value

    ctx.fillStyle = color2css(color, alpha)
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

export class TextVector extends _Text {
  readonly text_color:       p.Uniform<RGBA>
  readonly text_alpha:       p.Uniform<number>
  readonly text_font:        p.Uniform<string>
  readonly text_font_size:   p.Uniform<string>
  readonly text_font_style:  p.Uniform<FontStyle>
  readonly text_align:       p.Uniform<TextAlign>
  readonly text_baseline:    p.Uniform<TextBaseline>
  readonly text_line_height: p.Uniform<number>

  get doit(): boolean {
    const color = this.text_color.value
    const alpha = this.text_alpha.value

    return !(color == 0 || alpha == 0)
  }

  set_vectorize(ctx: Context2d, i: number): void {
    const color = this.text_color.get(i)
    const alpha = this.text_alpha.get(i)
    const font = this.font_value(i)
    const align = this.text_align.get(i)
    const baseline = this.text_baseline.get(i)

    ctx.fillStyle = color2css(color, alpha)
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
