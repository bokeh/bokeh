import {Markup, MarkupView} from "./markup"
import type * as p from "core/properties"
import {UIComponent} from "core/vdom"
import type {VNode} from "core/vdom"

import * as markup_css from "styles/widgets/markup.css"

export class ParagraphView extends MarkupView {
  declare readonly model: Paragraph
  declare readonly signals: p.SignalsOf<Paragraph.Props>

  override component(): VNode {
    const {text} = this.signals
    const markup = (() => {
      if (this.has_math_disabled()) {
        return <p class={markup_css.markup}>{text}</p>
      } else {
        const {value} = text
        const set_html = (el: HTMLElement | null): void => {
          if (el != null) {
            el.innerHTML = this.process_tex(value)
          }
        }
        return <p class={markup_css.markup} ref={set_html}></p>
      }
    })()

    return <UIComponent parent={this.resolved_props}>{markup}</UIComponent>
  }
}

export namespace Paragraph {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Markup.Props
}

export interface Paragraph extends Paragraph.Attrs {}

export class Paragraph extends Markup {
  declare properties: Paragraph.Props
  declare __view_type__: ParagraphView

  constructor(attrs?: Partial<Paragraph.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ParagraphView
  }
}
