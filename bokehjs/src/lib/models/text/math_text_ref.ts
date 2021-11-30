// import * as p from "core/properties"
// import {Context2d} from "core/util/canvas"
// import {color2hexrgb, color2rgba} from "core/util/color"
// import {Size} from "core/types"
// import {text_width} from "core/graphics"
// import {font_metrics} from "core/util/text"
// import {insert_text_on_position} from "core/util/string"
// import {BaseText, BaseTextView} from "./base_text"
// import { MathBox } from "core/math_graphics"

// /**
//  * Helper class for rendering MathText into Canvas
//  */
// export abstract class MathTextView extends BaseTextView {
//   override model: MathText

//   abstract override graphics(): MathBox

//   override async lazy_initialize() {
//     await super.lazy_initialize()
//     await this.graphics().load_provider()
//   }
// }

// export namespace MathText {
//   export type Attrs = p.AttrsOf<Props>

//   export type Props = BaseText.Props & {
//     text: p.Property<string>
//   }
// }

// export interface MathText extends MathText.Attrs {}

// export class MathText extends BaseText {
//   override properties: MathText.Props
//   override __view_type__: MathTextView

//   constructor(attrs?: Partial<MathText.Attrs>) {
//     super(attrs)
//   }
// }

// export class AsciiView extends MathTextView {
//   override model: Ascii

//   // TODO: Color ascii
//   override get styled_text(): string {
//     return this.text
//   }

//   protected _process_text(): HTMLElement | undefined {
//     return undefined // TODO: this.provider.MathJax?.ascii2svg(text)
//   }

//   override _size(): Size {
//     return {
//       width: text_width(this.text, this.font),
//       height: font_metrics(this.font).height,
//     }
//   }

//   override paint(ctx: Context2d) {
//     ctx.save()
//     const {sx, sy} = this.position

//     const {angle} = this
//     if (angle != null && angle != 0) {
//       ctx.translate(sx, sy)
//       ctx.rotate(angle)
//       ctx.translate(-sx, -sy)
//     }

//     const {x, y} = this._computed_position()
//     ctx.fillStyle = this.color
//     ctx.font = this.font
//     ctx.textAlign = "left"
//     ctx.textBaseline = "alphabetic"
//     ctx.fillText(this.text, x, y + font_metrics(this.font).ascent)


//     ctx.restore()
//     this._has_finished = true
//     this.parent.notify_finished_after_paint()
//   }
// }

// export namespace Ascii {
//   export type Attrs = p.AttrsOf<Props>
//   export type Props = MathText.Props
// }

// export interface Ascii extends Ascii.Attrs {}

// export class Ascii extends MathText {
//   override properties: Ascii.Props
//   override __view_type__: AsciiView

//   constructor(attrs?: Partial<Ascii.Attrs>) {
//     super(attrs)
//   }

//   static {
//     this.prototype.default_view = AsciiView
//   }
// }

// export class MathMLView extends MathTextView {
//   override model: MathML

//   override get styled_text(): string {
//     let styled = this.text.trim()
//     let matchs = styled.match(/<math(.*?[^?])?>/s)
//     if (!matchs)
//       return this.text.trim()

//     styled = insert_text_on_position(
//       styled,
//       styled.indexOf(matchs[0]) +  matchs[0].length,
//       `<mstyle displaystyle="true" mathcolor="${color2hexrgb(this.color)}" ${this.font.includes("bold") ? 'mathvariant="bold"' : "" }>`
//     )

//     matchs = styled.match(/<\/[^>]*?math.*?>/s)
//     if (!matchs)
//       return this.text.trim()

//     return insert_text_on_position(styled, styled.indexOf(matchs[0]), "</mstyle>")
//   }

//   protected _process_text(): HTMLElement | undefined {
//     const fmetrics = font_metrics(this.font)

//     return this.provider.MathJax?.mathml2svg(this.styled_text, {
//       em: this.base_font_size,
//       ex: fmetrics.x_height,
//     })
//   }
// }

// export namespace MathML {
//   export type Attrs = p.AttrsOf<Props>
//   export type Props = MathText.Props
// }

// export interface MathML extends MathML.Attrs {}

// export class MathML extends MathText {
//   override properties: MathML.Props
//   override __view_type__: MathMLView

//   constructor(attrs?: Partial<MathML.Attrs>) {
//     super(attrs)
//   }

//   static {
//     this.prototype.default_view = MathMLView
//   }
// }

// export class TeXView extends MathTextView {
//   override model: TeX

//   override get styled_text(): string {
//     const [r, g, b] = color2rgba(this.color)

//     return `\\color[RGB]{${r}, ${g}, ${b}} ${this.font.includes("bold") ? `\\bf{${this.text}}` : this.text}`
//   }

//   protected _process_text(): HTMLElement | undefined {
//     // TODO: allow plot/document level configuration of macros
//     const fmetrics = font_metrics(this.font)

//     return this.provider.MathJax?.tex2svg(this.styled_text, {
//       display: !this.model.inline,
//       em: this.base_font_size,
//       ex: fmetrics.x_height,
//     }, this.model.macros)
//   }
// }

// export namespace TeX {
//   export type Attrs = p.AttrsOf<Props>

//   export type Props = MathText.Props & {
//     macros: p.Property<{[key: string]: string | [string, number]}>
//     inline: p.Property<boolean>
//   }
// }

// export interface TeX extends TeX.Attrs {}

// export class TeX extends MathText {
//   override properties: TeX.Props
//   override __view_type__: TeXView

//   constructor(attrs?: Partial<TeX.Attrs>) {
//     super(attrs)
//   }

//   static {
//     this.prototype.default_view = TeXView

//     this.define<TeX.Props>(({Boolean, Number, String, Dict, Tuple, Or}) => ({
//       macros: [ Dict(Or(String, Tuple(String, Number))), {} ],
//       inline: [ Boolean, false ],
//     }))
//   }
// }
