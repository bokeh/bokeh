import {Markup, MarkupView} from "./markup"
import type * as p from "core/properties"

export class DivView extends MarkupView {
  declare model: Div

  override render(): void {
    super.render()
    if (this.model.render_as_text) {
      this.markup_el.textContent = this.model.text
    } else {
      this.markup_el.innerHTML = this.has_math_disabled() ? this.model.text : this.process_tex(this.model.text)
    }
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
