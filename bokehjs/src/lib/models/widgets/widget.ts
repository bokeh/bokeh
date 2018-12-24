import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {SizeHint, Layoutable} from "core/layout"
import {sized, unsized, size} from "core/dom"
import {Class} from "core/class"

export class DOMLayout extends Layoutable {

  constructor(readonly el: HTMLElement) {
    super()
  }

  size_hint(): SizeHint {
    const computed = this.clip_size(unsized(this.el, () => size(this.el)))

    const width = this.sizing.width != null ? this.sizing.width : computed.width
    const height = this.sizing.height != null ? this.sizing.height : computed.height

    return {width, height}
  }

  has_hfw(): boolean {
    return true
  }

  // XXX: doesn't preserve aspect
  hfw(width: number): number {
    const {height} = sized(this.el, {width}, () => size(this.el))
    return this.clip_height(height)
  }

  wfh(height: number): number {
    const {width} = sized(this.el, {height}, () => size(this.el))
    return this.clip_width(width)
  }
}

export namespace WidgetView {
  export type Options = LayoutDOMView.Options & {model: Widget}
}

export abstract class WidgetView extends LayoutDOMView {
  model: Widget
  default_view: Class<WidgetView, [WidgetView.Options]>

  get child_models(): LayoutDOM[] {
    return []
  }

  _update_layout(): void {
    this.layout = new DOMLayout(this.el)
    this.layout.set_sizing(this.box_sizing())
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

    this.override({
      margin: [5, 5, 5, 5],
    })
  }
}
Widget.initClass()
