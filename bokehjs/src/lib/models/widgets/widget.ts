import {HTMLBox, HTMLBoxView} from "../layouts/html_box"
import {Orientation} from "core/enums"
import {BoxSizing, SizingPolicy} from "core/layout"
import * as p from "core/properties"

export abstract class WidgetView extends HTMLBoxView {
  override model: Widget

  protected get orientation(): Orientation {
    return "horizontal"
  }

  protected get default_size(): number | undefined {
    return this.model.default_size
  }

  protected override _width_policy(): SizingPolicy {
    return this.orientation == "horizontal" ? super._width_policy() : "fixed"
  }

  protected override _height_policy(): SizingPolicy {
    return this.orientation == "horizontal" ? "fixed" : super._height_policy()
  }

  override box_sizing(): Partial<BoxSizing> {
    const sizing = super.box_sizing()
    if (this.orientation == "horizontal") {
      if (sizing.width == null)
        sizing.width = this.default_size
    } else {
      if (sizing.height == null)
        sizing.height = this.default_size
    }
    return sizing
  }
}

export namespace Widget {
  export type Attrs = p.AttrsOf<Props>

  export type Props = HTMLBox.Props & {
    default_size: p.Property<number>
  }
}

export interface Widget extends Widget.Attrs {}

export abstract class Widget extends HTMLBox {
  override properties: Widget.Props
  override __view_type__: WidgetView

  constructor(attrs?: Partial<Widget.Attrs>) {
    super(attrs)
  }

  static init_Widget(): void {
    this.define<Widget.Props>(({Number}) => ({
      default_size: [ Number, 300 ],
    }))

    this.override<Widget.Props>({
      margin: [5, 5, 5, 5],
    })
  }
}
