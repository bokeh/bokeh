import {UIElement, UIElementView} from "../ui/ui_element"
import {Node} from "../coordinates/node"
import {Anchor} from "../common/kinds"
import type {StyleSheetLike} from "core/dom"
import type {IterViews, ViewOf} from "core/build_views"
import {build_view} from "core/build_views"
import type * as p from "core/properties"

import panels_css, * as _panel from "styles/panels.css"

export class PanelView extends UIElementView {
  declare model: Panel

  protected _content: ViewOf<UIElement>

  override *children(): IterViews {
    yield* super.children()
    yield this._content
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), panels_css]
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const {content} = this.model
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

    this._content.render_to(this.shadow_el)
    document.body.append(this.el)
  }
}

export namespace Panel {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    position: p.Property<Node>
    anchor: p.Property<Anchor>
    content: p.Property<UIElement>
  }
}

export interface Panel extends Panel.Attrs {}

export class Panel extends UIElement {
  declare properties: Panel.Props
  declare __view_type__: PanelView

  constructor(attrs?: Partial<Panel.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PanelView

    this.define<Panel.Props>(({Ref}) => ({
      position: [ Ref(Node) ],
      anchor: [ Anchor, "top_left" ],
      content: [ Ref(UIElement) ],
    }))
  }
}
