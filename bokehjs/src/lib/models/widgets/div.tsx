import {Markup, MarkupView} from "./markup"
import type * as p from "core/properties"
import {UIComponent} from "core/vdom"
import type {VNode} from "core/vdom"

import * as markup_css from "styles/widgets/markup.css"

export class DivView extends MarkupView {
  declare readonly model: Div
  declare readonly signals: p.SignalsOf<Div.Props>

  override component(): VNode {
    const {text, render_as_text} = this.signals

    const markup = (() => {
      if (render_as_text.value) {
        return <div class={markup_css.markup}>{text}</div>
      } else {
        const {value} = text
        const set_html = (el: HTMLElement | null): void => {
          if (el != null) {
            el.innerHTML = this.has_math_disabled() ? value : this.process_tex(value)
          }
        }
        return <div class={markup_css.markup} ref={set_html}></div>
      }
    })()

    return <UIComponent parent={this.resolved_props}>{markup}</UIComponent>
  }
}

export namespace Div {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Markup.Props & {
    render_as_text: p.Property<boolean>
  }
}

export interface Div extends Div.Attrs {}

export class Div extends Markup {
  declare properties: Div.Props
  declare __view_type__: DivView

  constructor(attrs?: Partial<Div.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DivView

    this.define<Div.Props>(({Bool}) => ({
      render_as_text: [ Bool, false ],
    }))
  }
}
