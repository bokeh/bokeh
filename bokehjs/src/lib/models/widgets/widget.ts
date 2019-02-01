import {HTMLBox, HTMLBoxView} from "../layouts/html_box"
import {Class} from "core/class"
import * as p from "core/properties"

export namespace WidgetView {
  export type Options = HTMLBoxView.Options & {model: Widget}
}

export abstract class WidgetView extends HTMLBoxView {
  model: Widget
  default_view: Class<WidgetView, [WidgetView.Options]>
}

export namespace Widget {
  export type Attrs = p.AttrsOf<Props>

  export type Props = HTMLBox.Props
}

export interface Widget extends Widget.Attrs {}

export abstract class Widget extends HTMLBox {
  properties: Widget.Props

  constructor(attrs?: Partial<Widget.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Widget"

    this.override({
      margin: [5, 5, 5, 5],
    })
  }
}
Widget.initClass()
