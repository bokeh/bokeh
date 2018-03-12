import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {NumberSpec, StringSpec, AngleSpec} from "core/vectorization"
import {TextMixinVector} from "core/property_mixins"
import {Arrayable} from "core/types"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {get_text_height} from "core/util/text"
import {Context2d} from "core/util/canvas"

export interface TextData extends XYGlyphData {
  _text: Arrayable<string>
  _angle: Arrayable<number>
  _x_offset: Arrayable<number>
  _y_offset: Arrayable<number>
}

export interface TextView extends TextData {}

export class TextView extends XYGlyphView {
  model: Text
  visuals: Text.Visuals

  protected _render(ctx: Context2d, indices: number[], {sx, sy, _x_offset, _y_offset, _angle, _text}: TextData): void {
    for (const i of indices) {
      if (isNaN(sx[i] + sy[i] + _x_offset[i] + _y_offset[i] + _angle[i]) || _text[i] == null)
        continue

      if (this.visuals.text.doit) {
        const text = `${_text[i]}`

        ctx.save()
        ctx.translate(sx[i] + _x_offset[i], sy[i] + _y_offset[i])
        ctx.rotate(_angle[i])
        this.visuals.text.set_vectorize(ctx, i)

        if (text.indexOf("\n") == -1)
          ctx.fillText(text, 0, 0)
        else {
          const lines = text.split("\n")

          const font = this.visuals.text.cache_select("font", i)
          const {height} = get_text_height(font)
          const line_height = this.visuals.text.text_line_height.value()*height
          const block_height = line_height*lines.length

          const baseline = this.visuals.text.cache_select("text_baseline", i)
          let y: number
          switch (baseline) {
            case "top": {
              y = 0
              break
            }
            case "middle": {
              y = (-block_height/2) + (line_height/2)
              break
            }
            case "bottom": {
              y = -block_height + line_height
              break
            }
            default: {
              y = 0
              console.warn(`'${baseline}' baseline not supported with multi line text`)
            }
          }

          for (const line of lines) {
            ctx.fillText(line, 0, y)
            y += line_height
          }
        }

        ctx.restore()
      }
    }
  }
}

export namespace Text {
  export interface Mixins extends TextMixinVector {}

  export interface Attrs extends XYGlyph.Attrs, Mixins {
    text: StringSpec
    angle: AngleSpec
    x_offset: NumberSpec
    y_offset: NumberSpec
  }

  export interface Props extends XYGlyph.Props {}

  export interface Visuals extends XYGlyph.Visuals {
    text: visuals.Text
  }
}

export interface Text extends Text.Attrs {}

export class Text extends XYGlyph {

  properties: Text.Props

  constructor(attrs?: Partial<Text.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Text'
    this.prototype.default_view = TextView

    this.mixins(['text'])
    this.define({
      text:     [ p.StringSpec, {field: "text"} ],
      angle:    [ p.AngleSpec,  0               ],
      x_offset: [ p.NumberSpec, 0               ],
      y_offset: [ p.NumberSpec, 0               ],
    })
  }
}
Text.initClass()
