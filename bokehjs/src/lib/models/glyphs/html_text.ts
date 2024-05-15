import {TextBase, TextBaseView} from "./text_base"
import {div, InlineStyleSheet} from "core/dom"
import {non_null} from "core/util/types"
import type {Context2d} from "core/util/canvas"
import type {XY, LRTB, Corners} from "core/util/bbox"
import type * as p from "core/properties"

export interface HTMLTextView extends HTMLText.Data {}

export class HTMLTextView extends TextBaseView {
  declare model: HTMLText
  declare visuals: HTMLText.Visuals

  protected readonly _style = new InlineStyleSheet()

  protected _id_for(i: number): string {
    return `${this.model.id}-${i}`
  }

  protected _build_elements(text: p.Uniform<string | null>): (Element | null)[] {
    for (const el of this.elements) {
      el?.remove()
    }

    const elements = Array.from(text, (text_i, i) => {
      if (text_i == null) {
        return null
      } else {
        return div({id: `${this.model.id}-${i}`}, text_i)
      }
    })

    this.el.append(...elements.filter(non_null))
    return elements
  }

  override _set_data(): void {
    if (this.inherited_text) {
      this._inherit_attr<HTMLText.Data>("elements")
    } else {
      this._define_attr<HTMLText.Data>("elements", this._build_elements(this.text))
    }
  }

  override remove(): void {
    for (const el of this.elements) {
      el?.remove()
    }
    super.remove()
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<HTMLText.Data>): void {
    const {sx, sy, x_offset, y_offset, angle} = {...this, ...data}
    //const {anchor_: anchor, border_radius, padding} = this
    const {elements} = this

    for (const i of indices) {
      const sx_i = sx[i] + x_offset.get(i)
      const sy_i = sy[i] + y_offset.get(i)
      const angle_i = angle.get(i)
      const el_i = elements[i]

      if (!isFinite(sx_i + sy_i + angle_i) || el_i == null) {
        continue
      }

      //const anchor_i = anchor.get(i)
      this._paint_text(ctx, i, el_i, "" /*text_i*/, sx_i, sy_i, angle_i)
    }
  }

  protected _paint_text(ctx: Context2d, i: number, el: Element, text: string, sx: number, sy: number, angle: number): void {
    el.textContent = text
    this.visuals.text.set_vectorize(ctx, i)

    const {padding, border_radius} = this
    const id = this._id_for(i)

    this._style.append(`
    #${id} {
      left: ${sx}px;
      top: ${sy}px;
    }
    `)

    this._style.append(`
    #${id} {
      color: ${ctx.fillStyle};
      -webkit-text-stroke: 1px ${ctx.strokeStyle};
      font: ${ctx.font};
      white-space: pre;

      padding-left: ${padding.left}px;
      padding-right: ${padding.right}px;
      padding-top: ${padding.top}px;
      padding-bottom: ${padding.bottom}px;

      border-top-left-radius: ${border_radius.top_left}px;
      border-top-right-radius: ${border_radius.top_right}px;
      border-bottom-right-radius: ${border_radius.bottom_right}px;
      border-bottom-left-radius: ${border_radius.bottom_left}px;
    }
    `)

    const [x_anchor, x_t] = (() => {
      switch (this.visuals.text.text_align.get(i)) {
        case "left":   return ["left",   "0%"]
        case "center": return ["center", "-50%"]
        case "right":  return ["right",  "-100%"]
      }
    })()
    const [y_anchor, y_t] = (() => {
      switch (this.visuals.text.text_baseline.get(i)) {
        case "top":    return ["top",    "0%"]
        case "middle": return ["center", "-50%"]
        case "bottom": return ["bottom", "-100%"]
        default:       return ["center", "-50%"]  // "baseline"
      }
    })()

    let transform = `translate(${x_t}, ${y_t})`
    if (angle != 0) {
      transform += ` rotate(${angle}rad)`
    }

    this._style.append(`
    #${id} {
      transform-origin: ${x_anchor} ${y_anchor};
      transform: ${transform};
    }
    `)

    if (this.visuals.background_fill.v_doit(i)) {
      this.visuals.background_fill.set_vectorize(ctx, i)
      this._style.append(`
      #${id} {
        background-color: ${ctx.fillStyle};
      }
      `)
    }

    if (this.visuals.border_line.v_doit(i)) {
      this.visuals.border_line.set_vectorize(ctx, i)

      // attempt to support vector-style ("8 4 8") line dashing for css mode
      this._style.append(`
      #${id} {
        border-style: ${ctx.getLineDash().length < 2 ? "solid" : "dashed"};
        border-width: ${ctx.lineWidth}px;
        border-color: ${ctx.strokeStyle};
      }
      `)
    }
  }
}

export namespace HTMLText {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TextBase.Props & Mixins

  export type Mixins = TextBase.Mixins

  export type Visuals = TextBase.Visuals

  export type Data = p.GlyphDataOf<Props> & {
    readonly elements: (Element | null)[]

    anchor_: p.Uniform<XY<number>> // can't resolve in v_materialize() due to dependency on other properties
    padding: LRTB<number>
    border_radius: Corners<number>
  }
}

export interface HTMLText extends HTMLText.Attrs {}

export class HTMLText extends TextBase {
  declare properties: HTMLText.Props
  declare __view_type__: HTMLTextView

  constructor(attrs?: Partial<HTMLText.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HTMLTextView
  }
}
