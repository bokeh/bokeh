import {UIElement, UIElementView} from "../ui/ui_element"
import {DOMNode, DOMNodeView} from "../dom/dom_node"
import {Text} from "../dom/text"
import {StyleSheetLike, div} from "core/dom"
import {isString} from "core/util/types"
import {build_view, IterViews} from "core/build_views"
import * as p from "core/properties"

import dialogs_css, * as dialogs from "styles/dialogs.css"
import icons_css from "styles/icons.css"

type Button = UIElement
const Button = UIElement

export class DialogView extends UIElementView {
  override model: Dialog

  protected _content: DOMNodeView | UIElementView

  override *children(): IterViews {
    yield* super.children()
    yield this._content
  }

  override styles(): StyleSheetLike[] {
    return [...super.styles(), dialogs_css, icons_css]
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

  override render(): void {
    super.render()

    if (!this.model.visible) {
      this.el.remove()
      return
    }

    document.body.appendChild(this.el)
    this._content.render()

    const title = div({class: dialogs.title})
    const content = div({class: dialogs.content}, this._content.el)
    const buttons = div({class: dialogs.buttons})

    this.shadow_el.appendChild(title)
    this.shadow_el.appendChild(content)
    this.shadow_el.appendChild(buttons)

    if (this.model.closable) {
      const close = div({class: dialogs.close})
      close.addEventListener("click", () => this.model.visible = false)
      this.shadow_el.appendChild(close)
    }
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
