import {UIElement, UIElementView} from "../ui/ui_element"
import type {ToolbarView} from "./toolbar"
import type {StyleSheetLike} from "core/dom"
import * as divider_css from "styles/divider.css"
import type * as p from "core/properties"

export class DividerView extends UIElementView {
  declare model: Divider
  declare parent: ToolbarView

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), divider_css.default]
  }

  override render(): void {
    super.render()
    this.class_list.add(divider_css[this.parent.orientation])
  }
}

export namespace Divider {
  export type Attrs = p.AttrsOf<Props>
  export type Props = UIElement.Props
}

export interface Divider extends Divider.Attrs {}

export class Divider extends UIElement {
  declare properties: Divider.Props
  declare __view_type__: DividerView

  constructor(attrs?: Partial<Divider.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DividerView
  }
}
