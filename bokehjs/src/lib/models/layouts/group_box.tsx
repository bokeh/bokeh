import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {UIElement} from "../ui/ui_element"
import type {StyleSheetLike} from "core/stylesheets"
import type {VNode} from "core/vdom"
import {UIComponent} from "core/vdom"
import type * as p from "core/properties"
import * as group_box_css from "styles/group_box.css"

import type {TargetedEvent} from "preact"

export class GroupBoxView extends LayoutDOMView {
  declare readonly model: GroupBox
  declare readonly signals: p.SignalsOf<GroupBox.Props>
  declare readonly values: GroupBox.Attrs

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), group_box_css.default]
  }

  get child_models(): UIElement[] {
    return [this.values.child]
  }

  override component(): VNode {
    const {checkable, disabled, title} = this.values

    const on_change = (event: TargetedEvent<HTMLInputElement>) => {
      const checkbox_el = event.currentTarget
      this.model.disabled = !checkbox_el.checked
    }

    const ref = (el: HTMLElement | null) => {
      if (el != null) {
        for (const view of this.child_views) {
          view.render_to(el)
          view.r_after_render()
        }
      }
    }

    return (
      <UIComponent parent={this.resolved_props}>
        <fieldset ref={ref}>
          <legend>
            {checkable ? <input type="checkbox" checked={!disabled} onChange={on_change}/> : null}
            {title}
          </legend>
        </fieldset>
      </UIComponent>
    )
  }
}

export namespace GroupBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    title: p.Property<string | null>
    child: p.Property<UIElement>
    checkable: p.Property<boolean>
  }
}

export interface GroupBox extends GroupBox.Attrs {}

export class GroupBox extends LayoutDOM {
  declare properties: GroupBox.Props
  declare __view_type__: GroupBoxView

  constructor(attrs?: Partial<GroupBox.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = GroupBoxView

    this.define<GroupBox.Props>(({Bool, Str, Nullable, Ref}) => ({
      title: [ Nullable(Str), null ],
      child: [ Ref(UIElement) ],
      checkable: [ Bool, false ],
    }))
  }
}
