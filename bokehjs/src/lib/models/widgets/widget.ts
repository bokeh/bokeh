import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"

export abstract class WidgetView extends LayoutDOMView {
  model: Widget

  css_classes(): string[] {
    return super.css_classes().concat("bk-widget")
  }
}

export namespace Widget {
  export interface Attrs extends LayoutDOM.Attrs {}

  export interface Props extends LayoutDOM.Props {}
}

export interface Widget extends Widget.Attrs {}

export abstract class Widget extends LayoutDOM {

  properties: Widget.Props

  constructor(attrs?: Partial<Widget.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Widget"
  }
}
Widget.initClass()
