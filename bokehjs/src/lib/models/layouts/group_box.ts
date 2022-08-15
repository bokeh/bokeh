import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {fieldset, legend, input, StyleSheetLike} from "core/dom"
import * as p from "core/properties"
import group_box_css from "styles/group_box.css"

export class GroupBoxView extends LayoutDOMView {
  override model: GroupBox

  override styles(): StyleSheetLike[] {
    return [...super.styles(), group_box_css]
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.child.change, () => this.rebuild())
  }

  get child_models(): LayoutDOM[] {
    return [this.model.child]
  }

  override render(): void {
    super.render()

    const {checkable, disabled, title} = this.model
    const [child_view] = this.child_views

    const checkbox_el = checkable ? input({type: "checkbox", checked: !disabled}) : null
    const title_el = legend({}, checkbox_el, title)

    const fieldset_el = fieldset({}, title_el, child_view.el)
    this.shadow_el.appendChild(fieldset_el)
  }
}

// TODO: support `disabled` propagation

export namespace GroupBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    title: p.Property<string | null>
    child: p.Property<LayoutDOM>
    checkable: p.Property<boolean>
  }
}

export interface GroupBox extends GroupBox.Attrs {}

export class GroupBox extends LayoutDOM {
  override properties: GroupBox.Props
  override __view_type__: GroupBoxView

  constructor(attrs?: Partial<GroupBox.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = GroupBoxView

    this.define<GroupBox.Props>(({Boolean, String, Nullable, Ref}) => ({
      title: [ Nullable(String), null ],
      child: [ Ref(LayoutDOM) ],
      checkable: [ Boolean, false ],
    }))
  }
}
