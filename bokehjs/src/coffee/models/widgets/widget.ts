import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"

export abstract class WidgetView extends LayoutDOMView {
  model: Widget

  render(): void {
    this._render_classes() // XXX: because no super()

    // LayoutDOMView sets up lots of helpful things, but
    // it's render method is not suitable for widgets - who
    // should provide their own.
    if (this.model.height != null)
      this.el.style.height = `${this.model.height}px`
    if (this.model.width != null)
      this.el.style.width = `${this.model.width}px`
  }

  get_width(): number {
    throw new Error("unused")
  }

  get_height(): number {
    throw new Error("unused")
  }
}

WidgetView.prototype.className = "bk-widget"

export abstract class Widget extends LayoutDOM {}

Widget.prototype.type = "Widget"
