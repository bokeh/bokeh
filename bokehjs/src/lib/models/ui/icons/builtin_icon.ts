import {Icon, IconView} from "./icon"
import type {Color} from "core/types"
import type {StyleSheetLike} from "core/dom"
import {InlineStyleSheet} from "core/dom"
import {color2css} from "core/util/color"
import {isNumber} from "core/util/types"
import type * as p from "core/properties"

import * as icons_css from "styles/icons.css"
import * as builtin_icon_css from "styles/ui/builtin_icon.css"

export class BuiltinIconView extends IconView {
  declare model: BuiltinIcon

  protected readonly _style = new InlineStyleSheet("", "icon")

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), icons_css.default, builtin_icon_css.default, this._style]
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
        --icon: ${icon};
        --size: ${size};
        --color: ${color};
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
  declare properties: BuiltinIcon.Props
  declare __view_type__: BuiltinIconView

  constructor(attrs?: Partial<BuiltinIcon.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = BuiltinIconView

    this.define<BuiltinIcon.Props>(({Str, Color}) => ({
      icon_name: [ Str ],
      color: [ Color, "gray" ],
    }))
  }
}
