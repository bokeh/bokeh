import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"

export abstract class WidgetView extends LayoutDOMView {
  model: Widget

  suggest_dims(): void {}

  update_geometry(): void {
    // LayoutDOMView sets up lots of helpful things, but
    // it's render method is not suitable for widgets - who
    // should provide their own.
    if (this.model.height != null)
      this.el.style.height = `${this.model.height}px`
    if (this.model.width != null)
      this.el.style.width = `${this.model.width}px`
  }

  css_classes(): string[] {
    return super.css_classes().concat("bk-widget")
  }

  get_width(): number {
    throw new Error("unused")
  }

  get_height(): number {
    throw new Error("unused")
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
