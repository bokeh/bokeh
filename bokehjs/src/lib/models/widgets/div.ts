import {Markup, MarkupView} from "./markup"
import * as p from "core/properties"

export class DivView extends MarkupView {
  override model: Div

  override render(): void {
    super.render()
    if (this.model.render_as_text)
      this.markup_el.textContent = this.model.text
    else
      this.markup_el.innerHTML = this.has_math_disabled() ? this.model.text : this.process_tex()
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
  override properties: Div.Props
  override __view_type__: DivView

  constructor(attrs?: Partial<Div.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DivView

    this.define<Div.Props>(({Boolean}) => ({
      render_as_text: [ Boolean, false ],
    }))
  }
}
