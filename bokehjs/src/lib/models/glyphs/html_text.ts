import {Text, TextView} from "./text"
import {px, div} from "core/dom"
import type * as p from "core/properties"
import {isString, non_null} from "core/util/types"
import type {Context2d} from "core/util/canvas"

export class HTMLTextView extends TextView {
  declare model: HTMLText
  declare visuals: HTMLText.Visuals

  protected _elements: (HTMLElement | null)[] = []

  protected override async _build_labels(): Promise<void> {
    for (const el of this._elements) {
      el?.remove()
    }

    const {text} = this.base_glyph ?? this
    this._elements = Array.from(text, (text_i, i) => {
      if (text_i == null) {
        return null
      } else {
        return div({id: `${this.model.id}-${i}`}, text_i)
      }
    })

    this.el.append(...this._elements.filter(non_null))
  }

  override remove(): void {
    for (const el of this._elements) {
      el?.remove()
    }
    this._elements = []
    super.remove()
  }

  protected _paint_label(ctx: Context2d, i: number, el: HTMLElement, text: string, sx: number, sy: number, angle: number): void {
    // TODO append to frame element for clipping
    el.textContent = text

    this.visuals.text.set_vectorize(ctx, i)
    el.style.display = ""
    el.style.position = "absolute"
    el.style.left = `${sx}px`
    el.style.top = `${sy}px`
    if (isString(ctx.fillStyle)) {
      el.style.color = ctx.fillStyle
    }
    el.style.webkitTextStroke = `1px ${ctx.strokeStyle}`
    el.style.font = ctx.font
    el.style.whiteSpace = "pre"

    const [x_anchor, x_t] = (() => {
      switch (this.visuals.text.text_align.get(i)) {
        case "left": return ["left", "0%"]
        case "center": return ["center", "-50%"]
        case "right": return ["right", "-100%"]
      }
    })()
    const [y_anchor, y_t] = (() => {
      switch (this.visuals.text.text_baseline.get(i)) {
        case "top": return ["top", "0%"]
        case "middle": return ["center", "-50%"]
        case "bottom": return ["bottom", "-100%"]
        default: return ["center", "-50%"] // "baseline"
      }
    })()

    let transform = `translate(${x_t}, ${y_t})`
    if (angle != 0) {
      transform += `rotate(${angle}rad)`
    }

    el.style.transformOrigin = `${x_anchor} ${y_anchor}`
    el.style.transform = transform

    if (this.visuals.background_fill.doit) {
      this.visuals.background_fill.set_vectorize(ctx, i)
      if (isString(ctx.fillStyle)) {
        el.style.backgroundColor = ctx.fillStyle
      }
    }

    const {padding} = this
    el.style.paddingLeft = px(padding.left)
    el.style.paddingRight = px(padding.right)
    el.style.paddingTop = px(padding.top)
    el.style.paddingBottom = px(padding.bottom)

    const {border_radius} = this
    el.style.borderTopLeftRadius = px(border_radius.top_left)
    el.style.borderTopRightRadius = px(border_radius.top_right)
    el.style.borderBottomLeftRadius = px(border_radius.bottom_left)
    el.style.borderBottomRightRadius = px(border_radius.bottom_right)

    if (this.visuals.border_line.doit) {
      this.visuals.border_line.set_vectorize(ctx, i)

      // attempt to support vector-style ("8 4 8") line dashing for css mode
      el.style.borderStyle = ctx.getLineDash().length < 2 ? "solid" : "dashed"
      el.style.borderWidth = `${ctx.lineWidth}px`
      if (isString(ctx.strokeStyle)) {
        el.style.borderColor = ctx.strokeStyle
      }
    }
  }
}

export namespace HTMLText {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Text.Props & Mixins

  export type Mixins = Text.Mixins

  export type Visuals = Text.Visuals
}

export interface HTMLText extends HTMLText.Attrs {}

export class HTMLText extends Text {
  declare properties: HTMLText.Props
  declare __view_type__: HTMLTextView

  constructor(attrs?: Partial<HTMLText.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HTMLTextView
  }
}
