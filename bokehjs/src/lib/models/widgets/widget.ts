import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {SizeHint, Layoutable} from "core/layout"
import {margin} from "core/dom"

export class DOMLayout extends Layoutable {

  constructor(readonly el: HTMLElement) {
    super()
  }

  size_hint(): SizeHint {
    let width: number
    if (this.sizing.width_policy == "fixed")
      width = this.sizing.width
    else if (this.sizing.width_policy == "auto" && this.sizing.width != null)
      width = this.sizing.width
    else {
      width = 0
      for (const child of Array.from(this.el.children) as HTMLElement[]) {
        const margins = margin(child)
        const rect = child.getBoundingClientRect()
        width += rect.width + margins.left + margins.right
      }
      width = Math.ceil(width)
    }

    let height: number
    if (this.sizing.height_policy == "fixed")
      height = this.sizing.height
    else if (this.sizing.height_policy == "auto" && this.sizing.height != null)
      height = this.sizing.height
    else {
      height = 0
      for (const child of Array.from(this.el.children) as HTMLElement[]) {
        const margins = margin(child)
        const rect = child.getBoundingClientRect()
        height += rect.height + margins.top + margins.bottom
      }
      height = Math.ceil(height)
    }

    return {width, height}
  }
}

export abstract class WidgetView extends LayoutDOMView {
  model: Widget

  get child_models(): LayoutDOM[] {
    return []
  }

  _update_layout(): void {
    this.layout = new DOMLayout(this.el)
    this.layout.sizing = this.box_sizing()
  }

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
