import {Markup, MarkupView} from "./markup"
import type * as p from "core/properties"
import {UIComponent} from "core/vdom"
import type {VNode} from "core/vdom"
import {follow_fragment_link} from "core/util/links"

import * as markup_css from "styles/widgets/markup.css"

export class DivView extends MarkupView {
  declare readonly model: Div
  declare readonly signals: p.SignalsOf<Div.Props>

  override connect_signals(): void {
    super.connect_signals()
    // The text is rendered in a shadow root, so the browser can't find the targets
    // of fragment links (`<a href="#name">`) in it, nor in any other component.
    this.shadow_el.addEventListener("click", (event) => {
      if (event instanceof MouseEvent) {
        this._follow_fragment_link(event)
      }
    })
  }

  protected _follow_fragment_link(event: MouseEvent): void {
    follow_fragment_link(event, this.shadow_el)
  }

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

  static {
    this.prototype.default_view = DivView

    this.define<Div.Props>(({Bool}) => ({
      render_as_text: [ Bool, false ],
    }))
  }
}
