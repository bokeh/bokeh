import {Markup, MarkupView} from "./markup"
import type * as p from "core/properties"
import {UIComponent} from "core/vdom"
import type {VNode} from "core/vdom"

import * as markup_css from "styles/widgets/markup.css"

export class PreTextView extends MarkupView {
  declare readonly model: PreText
  declare readonly signals: p.SignalsOf<PreText.Props>

  override component(): VNode {
    const {text} = this.signals
    return (
      <UIComponent parent={this.resolved_props}>
        <pre class={markup_css.markup}>{text}</pre>
      </UIComponent>
    )
  }
}

export namespace PreText {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Markup.Props
}

export interface PreText extends PreText.Attrs {}

export class PreText extends Markup {
  declare properties: PreText.Props
  declare __view_type__: PreTextView

  constructor(attrs?: Partial<PreText.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PreTextView
  }
}
