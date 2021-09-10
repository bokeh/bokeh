import {Markup, MarkupView} from "./markup"
import * as p from "core/properties"
import {BundleProvider, MathJaxProvider} from "models/text/providers"
import {find_math_parts} from "models/text/utils"
import {TeX} from "models"

const default_provider: MathJaxProvider = new BundleProvider()
export class DivView extends MarkupView {
  override model: Div

  get provider(): MathJaxProvider {
    return default_provider
  }

  override async lazy_initialize() {
    await super.lazy_initialize()

    if (this.provider.status == "not_started")
      await this.provider.fetch()
  }

  override render(): void {
    super.render()
    if (this.model.render_as_text)
      this.markup_el.textContent = this.model.text
    else if (this.model.enable_tex) {
      const html_with_svgs = find_math_parts(this.model.text).map(el => {
        if (el instanceof TeX) return this.provider.MathJax?.tex2svg(el.text, {display: !el.inline}).outerHTML
        else return el.text
      }).join("")

      this.markup_el.innerHTML = html_with_svgs
    } else
      this.markup_el.innerHTML = this.model.text
  }
}

export namespace Div {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Markup.Props & {
    render_as_text: p.Property<boolean>
    enable_tex: p.Property<boolean>
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
      enable_tex: [ Boolean, false ],
    }))
  }
}
