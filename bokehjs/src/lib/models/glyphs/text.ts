import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {NumberSpec, StringSpec, AngleSpec} from "core/vectorization"
import {TextMixinVector} from "core/property_mixins"
import {PointGeometry} from "core/geometry";
import * as hittest from "core/hittest";
import {Arrayable} from "core/types"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {get_text_height} from "core/util/text"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"

export interface TextData extends XYGlyphData {
  _text: Arrayable<string>
  _angle: Arrayable<number>
  _x_offset: Arrayable<number>
  _y_offset: Arrayable<number>

  _sxs: number[][][]
  _sys: number[][][]
}

export interface TextView extends TextData {}

export class TextView extends XYGlyphView {
  model: Text
  visuals: Text.Visuals

  private _rotate_point(x: number, y: number, xoff: number, yoff: number, angle: number): [number, number] {
    const sxr = (x - xoff) * Math.cos(angle) - (y - yoff) * Math.sin(angle) + xoff
    const syr = (x - xoff) * Math.sin(angle) + (y - yoff) * Math.cos(angle) + yoff
    return [sxr, syr]
  }

  private _text_bounds(x0: number, y0: number, width: number, height: number): [number[], number[]] {
    const xvals = [x0, x0 + width, x0 + width, x0, x0]
    const yvals = [y0, y0, y0 - height, y0 - height, y0]
    return [xvals, yvals]
  }

  protected _render(ctx: Context2d, indices: number[], {sx, sy, _x_offset, _y_offset, _angle, _text}: TextData): void {
    this._sys = []
    this._sxs = []
    for (const i of indices) {
      if (isNaN(sx[i] + sy[i] + _x_offset[i] + _y_offset[i] + _angle[i]) || _text[i] == null)
        continue
      this._sxs[i] = []
      this._sys[i] = []
      if (this.visuals.text.doit) {
        const text = `${_text[i]}`

        ctx.save()
        ctx.translate(sx[i] + _x_offset[i], sy[i] + _y_offset[i])
        ctx.rotate(_angle[i])
        this.visuals.text.set_vectorize(ctx, i)

        const font = this.visuals.text.cache_select("font", i)
        const {height} = get_text_height(font)
        const line_height = this.visuals.text.text_line_height.value()*height
        if (text.indexOf("\n") == -1){
          ctx.fillText(text, 0, 0)
          const x0 = sx[i] + _x_offset[i]
          const y0 = sy[i] + _y_offset[i]
          const width = ctx.measureText(text).width
          const [xvalues, yvalues] = this._text_bounds(x0, y0, width, line_height)
          this._sxs[i].push(xvalues)
          this._sys[i].push(yvalues)
        } else {
          const lines = text.split("\n")
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

            const x0 = sx[i] + _x_offset[i]
            const y0 = y + sy[i] + _y_offset[i]
            const width = ctx.measureText(line).width
            const [xvalues, yvalues] = this._text_bounds(x0, y0, width, line_height)
            this._sxs[i].push(xvalues)
            this._sys[i].push(yvalues)

            y += line_height
          }
        }

        ctx.restore()
      }
    }
  }

  protected _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry;
    const hits = []

    for (let i = 0; i < this._sxs.length; i++) {
      const sxs = this._sxs[i]
      const sys = this._sys[i]
      const n = sxs.length
      for (let j = 0, endj = n; j < endj; j++) {
        const [sxr, syr] = this._rotate_point(sx, sy, sxs[n-1][0], sys[n-1][0], -this._angle[i])
        if (hittest.point_in_poly(sxr, syr, sxs[j], sys[j])) {
          hits.push(i);
        }
      }
    }
    const result = hittest.create_empty_hit_test_result()
    result.indices = hits
    return result
  }

  private _scenterxy(i: number): {x:number, y:number} {
    const sx0 = this._sxs[i][0][0]
    const sy0 = this._sys[i][0][0]
    const sxc = (this._sxs[i][0][2] + sx0) / 2
    const syc = (this._sys[i][0][2] + sy0) / 2
    const [sxcr, sycr] = this._rotate_point(sxc, syc, sx0, sy0, this._angle[i])
    return {x: sxcr, y:sycr}
  }

  scenterx(i: number): number {
    return this._scenterxy(i).x
  }

  scentery(i: number): number {
    return this._scenterxy(i).y
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
