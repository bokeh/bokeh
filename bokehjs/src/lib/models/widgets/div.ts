import {Markup, MarkupView} from "./markup"
import * as p from "core/properties"
import { contains_tex, tex2html } from "models/text/html_math_text"

export class DivView extends MarkupView {
  override model: Div

  override render(): void {
    super.render()
    if (this.model.render_as_text)
      this.markup_el.textContent = this.model.text
    else {
      this.markup_el.innerHTML = this.model.disable_math || !contains_tex(this.model.text)
        ? this.model.text
        : tex2html(this.model.text)
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
