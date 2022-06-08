import {Icon, IconView} from "./icon"
import {span, GlobalStyleSheet, ImportedStyleSheet, StyleSheetLike} from "core/dom"
import * as p from "core/properties"

export class TablerIconView extends IconView {
  override model: TablerIcon
  static override tag_name = "span" as const

  protected static readonly _url = "https://unpkg.com/@tabler/icons@latest/iconfont"

  protected static readonly _fonts = new GlobalStyleSheet(`\
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

  override styles(): StyleSheetLike[] {
    return [...super.styles(), this._tabler]
  }

  override initialize(): void {
    super.initialize()
    TablerIconView._fonts.initialize()
  }

  render(): void {
    this.empty()
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
  override properties: TablerIcon.Props
  override __view_type__: TablerIconView

  constructor(attrs?: Partial<TablerIcon.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TablerIconView

    this.define<TablerIcon.Props>(({String}) => ({
      icon_name: [ String ],
    }))
  }
}
