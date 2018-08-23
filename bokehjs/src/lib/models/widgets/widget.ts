import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {SizeHint, Layoutable} from "core/layout"
import {border, margin, div} from "core/dom"

export class DOMLayout extends Layoutable {

  constructor(readonly el: HTMLElement) {
    super()
  }

  size_hint(): SizeHint {
    const borders = border(this.el)
    const margins = margin(this.el)

    let width: number
    if (this.sizing.width_policy == "fixed")
      width = this.sizing.width
    else
      width = this.el.scrollWidth + margins.left + margins.right + borders.left + borders.right

    let height: number
    if (this.sizing.height_policy == "fixed")
      height = this.sizing.height
    else
      height = this.el.scrollHeight + margins.top + margins.bottom + borders.top + borders.bottom

    return {width, height}
  }
}

export abstract class WidgetView extends LayoutDOMView {
  model: Widget

  content_el: HTMLElement

  protected _createElement(): HTMLElement {
    const el = super._createElement()
    this.content_el = div({style: {width: "100%"}})
    el.appendChild(this.content_el)
    return el
  }

  get child_models(): LayoutDOM[] {
    return []
  }

  update_layout(): void {
    this.layout = new DOMLayout(this.content_el)
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
