import {UIElement, UIElementView} from "../ui/ui_element"
import type {ToolbarView} from "./toolbar"
import {LogoStyle as LogoStyle} from "core/enums"
import type {StyleSheetLike} from "core/dom"
import {a} from "core/dom"
import * as logo_css from "styles/logo.css"
import type * as p from "core/properties"

export class LogoView extends UIElementView {
  declare model: Logo
  declare parent: ToolbarView

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), logo_css.default]
  }

  override render(): void {
    super.render()

    this.class_list.add(logo_css.small)
    this.class_list.toggle(logo_css.grey, this.model.style == "grey")

    const logo_el = a({href: "https://bokeh.org/", target: "_blank"})
    this.shadow_el.append(logo_el)
  }
}

export namespace Logo {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    style: p.Property<LogoStyle>
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
      style: [ LogoStyle, "normal" ],
    }))
  }
}
