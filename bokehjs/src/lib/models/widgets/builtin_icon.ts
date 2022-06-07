import {AbstractIcon, AbstractIconView} from "./abstract_icon"
import {Color} from "core/types"
import {color2css} from "core/util/color"
import {assign} from "core/util/object"
import * as p from "core/properties"

import icons_css from "styles/icons.css"

export class BuiltinIconView extends AbstractIconView {
  override model: BuiltinIcon
  override el: HTMLElement

  override styles(): string[] {
    return [...super.styles(), icons_css]
  }

  render(): void {
    this.empty()

    const icon = `var(--bokeh-icon-${this.model.identifier}`
    const color = color2css(this.model.color)

    assign(this.el.style, {
      width: "18px",
      height: "18px",
      "background-color": color,
      "mask-image": icon,
      "mask-size": "contain",
      "mask-repeat": "no-repeat",
      "-webkit-mask-image": icon,
      "-webkit-mask-size": "contain",
      "-webkit-mask-repeat": "no-repeat",
    })
  }
}

export namespace BuiltinIcon {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractIcon.Props & {
    identifier: p.Property<string>
    color: p.Property<Color>
  }
}

export interface BuiltinIcon extends BuiltinIcon.Attrs {}

export class BuiltinIcon extends AbstractIcon {
  override properties: BuiltinIcon.Props
  override __view_type__: BuiltinIconView

  constructor(attrs?: Partial<BuiltinIcon.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = BuiltinIconView

    this.define<BuiltinIcon.Props>(({String, Color}) => ({
      identifier: [ String ],
      color: [ Color, "gray" ],
    }))
  }
}
