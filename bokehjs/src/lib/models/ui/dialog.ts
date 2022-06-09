import {UIElement, UIElementView} from "../ui/ui_element"
import {DOMNode, DOMNodeView, Text} from "../dom/index"
import {StyleSheetLike} from "core/dom"
import {isString} from "core/util/types"
import {build_view} from "core/build_views"
import * as p from "core/properties"

type Button = UIElement
const Button = UIElement

export class DialogView extends UIElementView {
  override model: Dialog

  protected _content: DOMNodeView | UIElementView

  override styles(): StyleSheetLike[] {
    return [...super.styles()]
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const content = (() => {
      const {content} = this.model
      return isString(content) ? new Text({content}) : content
    })()

    this._content = await build_view(content, {parent: this})
  }

  override connect_signals(): void {
    super.connect_signals()

    const {visible} = this.model.properties
    this.on_change(visible, () => this.render())
  }

  override remove(): void {
    this._content.remove()
    super.remove()
  }

  render(): void {
    if (!this.model.visible) {
      this.el.remove()
      return
    }

    document.body.appendChild(this.el)

    this.empty()
    this._content.render()
    this.shadow_el.appendChild(this._content.el)
  }
}

export namespace Dialog {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    title: p.Property<string | DOMNode | null>
    content: p.Property<string | DOMNode | UIElement>
    buttons: p.Property<Button[]>
    modal: p.Property<boolean>
    closable: p.Property<boolean>
    draggable: p.Property<boolean>
  }
}

export interface Dialog extends Dialog.Attrs {}

export class Dialog extends UIElement {
  override properties: Dialog.Props
  override __view_type__: DialogView

  constructor(attrs?: Partial<Dialog.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DialogView

    this.define<Dialog.Props>(({Boolean, String, Array, Ref, Or, Nullable}) => ({
      title: [ Nullable(Or(String, Ref(DOMNode))), null ],
      content: [ Or(String, Ref(DOMNode), Ref(UIElement)) ],
      buttons: [ Array(Ref(Button)), [] ],
      modal: [ Boolean, false ],
      closable: [ Boolean, true ],
      draggable: [ Boolean, true ],
    }))
  }
}
