import {UIElement, UIElementView} from "./ui_element"
import {ViewStorage, build_views, remove_views} from "core/build_views"
import {SerializableState} from "core/view"
import * as p from "core/properties"

export class PaneView extends UIElementView {
  override model: Pane

  protected _child_views: ViewStorage<UIElement> = new Map()
  get child_views(): UIElementView[] {
    return this.model.children.map((child) => this._child_views.get(child)!)
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await build_views(this._child_views, this.model.children, {parent: this})
  }

  override remove(): void {
    remove_views(this._child_views)
    super.remove()
  }

  override render(): void {
    super.render()

    for (const child_view of this.child_views) {
      this.shadow_el.appendChild(child_view.el)
      child_view.render()
      child_view.after_render()
    }
  }

  override has_finished(): boolean {
    if (!super.has_finished())
      return false

    for (const child_view of this.child_views) {
      if (!child_view.has_finished())
        return false
    }

    return true
  }

  override serializable_state(): SerializableState {
    return {
      ...super.serializable_state(),
      children: this.child_views.map((child) => child.serializable_state()),
    }
  }
}

export namespace Pane {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    children: p.Property<UIElement[]>
  }
}

export interface Pane extends Pane.Attrs {}

export class Pane extends UIElement {
  override properties: Pane.Props
  override __view_type__: PaneView

  constructor(attrs?: Partial<Pane.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PaneView

    this.define<Pane.Props>(({Array, Ref}) => ({
      children: [ Array(Ref(UIElement)), [] ],
    }))
  }
}
