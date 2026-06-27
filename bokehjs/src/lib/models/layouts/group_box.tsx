import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {UIElement} from "../ui/ui_element"
import type {StyleSheetLike} from "core/dom"
import {fieldset, legend, input, display} from "core/dom"
import type * as p from "core/properties"
import group_box_css from "styles/group_box.css"

export class GroupBoxView extends LayoutDOMView {
  declare model: GroupBox

  checkbox_el: HTMLInputElement
  fieldset_el: HTMLFieldSetElement

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), group_box_css]
  }

  override connect_signals(): void {
    super.connect_signals()
    const {child} = this.model.properties
    this.on_change(child, () => this.update_children())

    const {checkable, disabled} = this.model.properties
    this.on_change(checkable, () => {
      display(this.checkbox_el, this.model.checkable)
    })
    this.on_change(disabled, () => {
      this.checkbox_el.checked = !this.model.disabled
    })
  }

  get child_models(): UIElement[] {
    return [this.model.child]
  }

  override render(): void {
    super.render()

    const {checkable, disabled, title} = this.model

    this.checkbox_el = input({type: "checkbox", checked: !disabled})
    this.checkbox_el.addEventListener("change", () => {
      this.model.disabled = !this.checkbox_el.checked
    })
    display(this.checkbox_el, checkable)

    const title_el = legend({}, this.checkbox_el, title)

    const child_els = this.child_views.map((child) => child.el)
    this.fieldset_el = fieldset({}, title_el, ...child_els)
    this.shadow_el.appendChild(this.fieldset_el)
  }

  protected override _update_children(): void {
    const child_els = this.child_views.map((child) => child.el)
    this.fieldset_el.append(...child_els)
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
