import {UIElement, UIElementView} from "../ui_element"
import type * as p from "core/properties"

export abstract class IconView extends UIElementView {
  declare model: Icon

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }
}

export namespace Icon {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    size: p.Property<number | string>
  }
}

export interface Icon extends Icon.Attrs {}

export abstract class Icon extends UIElement {
  declare properties: Icon.Props
  declare __view_type__: IconView

  constructor(attrs?: Partial<Icon.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Icon.Props>(({Float, Or, CSSLength}) => ({
      size: [ Or(Float, CSSLength), "1em" ],
    }))
  }
}
