import {HTMLBox, HTMLBoxView} from "../layouts/html_box"
import {Orientation} from "core/enums"
import {BoxSizing, SizingPolicy} from "core/layout"
import * as p from "core/properties"

export abstract class WidgetView extends HTMLBoxView {
  model: Widget

  protected _width_policy(): SizingPolicy {
    return this.model.orientation == "horizontal" ? super._width_policy() : "fixed"
  }

  protected _height_policy(): SizingPolicy {
    return this.model.orientation == "horizontal" ? "fixed" : super._height_policy()
  }

  box_sizing(): Partial<BoxSizing> {
    const sizing = super.box_sizing()
    if (this.model.orientation == "horizontal") {
      if (sizing.width == null)
        sizing.width = this.model.default_size
    } else {
      if (sizing.height == null)
        sizing.height = this.model.default_size
    }
    return sizing
  }
}

export namespace Widget {
  export type Attrs = p.AttrsOf<Props>

  export type Props = HTMLBox.Props & {
    orientation: p.Property<Orientation>
    default_size: p.Property<number>
  }
}

export interface Widget extends Widget.Attrs {}

export abstract class Widget extends HTMLBox {
  properties: Widget.Props
  __view_type__: WidgetView

  constructor(attrs?: Partial<Widget.Attrs>) {
    super(attrs)
  }

  static init_Widget(): void {
    this.define<Widget.Props>(({Number}) => ({
      orientation:  [ Orientation, "horizontal" ],
      default_size: [ Number,      300          ],
    }))

    this.override<Widget.Props>({
      margin: [5, 5, 5, 5],
    })
  }
}
