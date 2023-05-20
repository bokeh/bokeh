import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {UIElement} from "../ui/ui_element"
import {ScrollbarPolicy} from "core/enums"
import type {StyleSheetLike} from "core/dom"
import type * as p from "core/properties"

export class ScrollBoxView extends LayoutDOMView {
  declare model: ScrollBox

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets()]
  }

  override connect_signals(): void {
    super.connect_signals()

    const {child, horizontal_scrollbar, vertical_scrollbar} = this.model.properties
    this.on_change(child, () => this.update_children())
    this.on_change([horizontal_scrollbar, vertical_scrollbar], () => this.invalidate_layout())
  }

  get child_models(): UIElement[] {
    return [this.model.child]
  }

  override _update_layout(): void  {
    super._update_layout()

    function to_overflow(policy: ScrollbarPolicy) {
      switch (policy) {
        case "auto":    return "auto"
        case "visible": return "scroll"
        case "hidden":  return "hidden"
      }
    }

    const {horizontal_scrollbar, vertical_scrollbar} = this.model
    this.style.append(":host", {
      overflow_x: to_overflow(horizontal_scrollbar),
      overflow_y: to_overflow(vertical_scrollbar),
    })
  }
}

export namespace ScrollBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    child: p.Property<UIElement>
    horizontal_scrollbar: p.Property<ScrollbarPolicy>
    vertical_scrollbar: p.Property<ScrollbarPolicy>
  }
}

export interface ScrollBox extends ScrollBox.Attrs {}

export class ScrollBox extends LayoutDOM {
  declare properties: ScrollBox.Props
  declare __view_type__: ScrollBoxView

  constructor(attrs?: Partial<ScrollBox.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ScrollBoxView

    this.define<ScrollBox.Props>(({Ref}) => ({
      child: [ Ref(UIElement) ],
      horizontal_scrollbar: [ ScrollbarPolicy, "auto" ],
      vertical_scrollbar: [ ScrollbarPolicy, "auto" ],
    }))
  }
}
