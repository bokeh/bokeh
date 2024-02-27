import {Icon, IconView} from "./icon"
import type {StyleSheetLike} from "core/dom"
import {span, InlineStyleSheet, ImportedStyleSheet, GlobalInlineStyleSheet} from "core/dom"
import {isNumber} from "core/util/types"
import type * as p from "core/properties"

export class TablerIconView extends IconView {
  declare model: TablerIcon

  protected static readonly _url = "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest"

  protected static readonly _fonts = new GlobalInlineStyleSheet(`\
    /*!
    * Tabler Icons 1.68.0 by tabler - https://tabler.io
    * License - https://github.com/tabler/tabler-icons/blob/master/LICENSE
    */
  @font-face {
    font-family: "tabler-icons";
    font-style: normal;
    font-weight: 400;
    src: url("${this._url}/fonts/tabler-icons.eot");
    src: url("${this._url}/fonts/tabler-icons.eot?#iefix") format("embedded-opentype"),
         url("${this._url}/fonts/tabler-icons.woff2") format("woff2"),
         url("${this._url}/fonts/tabler-icons.woff") format("woff"),
         url("${this._url}/fonts/tabler-icons.ttf") format("truetype"),
         url("${this._url}/fonts/tabler-icons.svg#tabler-icons") format("svg");
  }

  @media screen and (-webkit-min-device-pixel-ratio: 0) {
    @font-face {
      font-family: "tabler-icons";
      src: url("${this._url}/fonts/tabler-icons.svg#tabler-icons") format("svg");
    }
  }
`)

  protected readonly _tabler = new ImportedStyleSheet(`${TablerIconView._url}/tabler-icons.min.css`)

  protected readonly _style = new InlineStyleSheet()

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), TablerIconView._fonts, this._tabler, this._style]
  }

  override render(): void {
    super.render()

    const size = (() => {
      const {size} = this.model
      return isNumber(size) ? `${size}px` : size
    })()

    this._style.replace(`
      :host {
        display: inline-block;
        vertical-align: middle;
        font-size: ${size};
      }
    `)

    const icon = span({class: ["ti", `ti-${this.model.icon_name}`]})
    this.shadow_el.appendChild(icon)
  }
}

export namespace TablerIcon {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Icon.Props & {
    icon_name: p.Property<string>
  }
}

export interface TablerIcon extends TablerIcon.Attrs {}

export class TablerIcon extends Icon {
  declare properties: TablerIcon.Props
  declare __view_type__: TablerIconView

  constructor(attrs?: Partial<TablerIcon.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TablerIconView

    this.define<TablerIcon.Props>(({Str}) => ({
      icon_name: [ Str ],
    }))
  }
}
