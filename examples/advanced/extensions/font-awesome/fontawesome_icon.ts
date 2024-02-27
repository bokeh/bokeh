import {Icon, IconView} from "models/ui/icons/icon"
import {isNumber} from "core/util/types"
import {InlineStyleSheet, StyleSheetLike} from "core/dom"
import * as p from "core/properties"

import "./fontawesome.less"

export class FontAwesomeIconView extends IconView {
  declare model: FontAwesomeIcon

  protected readonly _style = new InlineStyleSheet()

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), this._style]
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  render(): void {
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

    this.el.classList.add("bk-u-fa")
    this.el.classList.add(`bk-u-fa-${this.model.icon_name}`)

    if (this.model.flip != null)
      this.el.classList.add(`bk-u-fa-flip-${this.model.flip}`)

    if (this.model.spin)
      this.el.classList.add("bk-u-fa-spin")
  }
}

export namespace FontAwesomeIcon {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Icon.Props & {
    icon_name: p.Property<string>
    flip: p.Property<"horizontal" | "vertical" | null>
    spin: p.Property<boolean>
  }
}

export interface FontAwesomeIcon extends FontAwesomeIcon.Attrs {}

export class FontAwesomeIcon extends Icon {
  declare properties: FontAwesomeIcon.Props
  declare __view_type__: FontAwesomeIconView

  constructor(attrs?: Partial<FontAwesomeIcon.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = FontAwesomeIconView

    this.define<FontAwesomeIcon.Props>(({Bool, Str, Enum, Nullable}) => ({
      icon_name: [ Str ],
      flip:      [ Nullable(Enum("horizontal", "vertical")), null ],
      spin:      [ Bool, false ],
    }))
  }
}
