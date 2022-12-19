import {Icon, IconView} from "./icon"
import {Color} from "core/types"
import {InlineStyleSheet, StyleSheetLike} from "core/dom"
import {color2css} from "core/util/color"
import {isNumber} from "core/util/types"
import * as p from "core/properties"

import icons_css from "styles/icons.css"

export class BuiltinIconView extends IconView {
  override model: BuiltinIcon

  protected readonly _style = new InlineStyleSheet()

  override styles(): StyleSheetLike[] {
    return [...super.styles(), icons_css, this._style]
  }

  override render(): void {
    super.render()

    const icon = `var(--bokeh-icon-${this.model.icon_name})`
    const color = color2css(this.model.color)

    const size = (() => {
      const {size} = this.model
      return isNumber(size) ? `${size}px` : size
    })()

    this._style.replace(`
      :host {
        display: inline-block;
        vertical-align: middle;
        width: ${size};
        height: ${size};
        background-color: ${color};
        mask-image: ${icon};
        mask-size: contain;
        mask-repeat: no-repeat;
        -webkit-mask-image: ${icon};
        -webkit-mask-size: contain;
        -webkit-mask-repeat: no-repeat;
      }
    `)
  }
}

export namespace BuiltinIcon {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Icon.Props & {
    icon_name: p.Property<string>
    color: p.Property<Color>
  }
}

export interface BuiltinIcon extends BuiltinIcon.Attrs {}

export class BuiltinIcon extends Icon {
  override properties: BuiltinIcon.Props
  override __view_type__: BuiltinIconView

  constructor(attrs?: Partial<BuiltinIcon.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = BuiltinIconView

    this.define<BuiltinIcon.Props>(({String, Color}) => ({
      icon_name: [ String ],
      color: [ Color, "gray" ],
    }))
  }
}
