import {Icon, IconView} from "./icon"
import type {StyleSheetLike} from "core/dom"
import {InlineStyleSheet} from "core/dom"
import {isNumber} from "core/util/types"
import type * as p from "core/properties"

export class SVGIconView extends IconView {
  declare model: SVGIcon

  protected readonly _style = new InlineStyleSheet()

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), this._style]
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
      }
      :host svg {
        width: ${size};
        height: ${size};
      }
    `)

    const parser = new DOMParser()
    const doc = parser.parseFromString(this.model.svg, "image/svg+xml")
    this.shadow_el.append(doc.documentElement)
  }
}

export namespace SVGIcon {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Icon.Props & {
    svg: p.Property<string>
  }
}

export interface SVGIcon extends SVGIcon.Attrs {}

export class SVGIcon extends Icon {
  declare properties: SVGIcon.Props
  declare __view_type__: SVGIconView

  constructor(attrs?: Partial<SVGIcon.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SVGIconView

    this.define<SVGIcon.Props>(({Str}) => ({
      svg: [ Str ],
    }))
  }
}
