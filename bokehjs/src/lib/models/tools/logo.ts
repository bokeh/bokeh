import {UIElement, UIElementView} from "../ui/ui_element"
import {LogoVariant} from "core/enums"
import type {StyleSheetLike} from "core/dom"
import {a} from "core/dom"
import {version} from "version"
import * as logo_css from "styles/logo.css"
import type * as p from "core/properties"

export class LogoView extends UIElementView {
  declare model: Logo

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), logo_css.default]
  }

  override render(): void {
    super.render()

    this.class_list.toggle(logo_css.grey, this.model.variant == "grey")

    const logo_el = a({href: "https://bokeh.org/", target: "_blank", title: `Bokeh ${version}`})
    this.shadow_el.append(logo_el)
  }
}

export namespace Logo {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    variant: p.Property<LogoVariant>
  }
}

export interface Logo extends Logo.Attrs {}

export class Logo extends UIElement {
  declare properties: Logo.Props
  declare __view_type__: LogoView

  constructor(attrs?: Partial<Logo.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = LogoView

    this.define<Logo.Props>(() => ({
      variant: [ LogoVariant, "normal" ],
    }))
  }
}
