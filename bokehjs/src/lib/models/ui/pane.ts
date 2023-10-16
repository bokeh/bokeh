import {UIElement, UIElementView} from "./ui_element"
import type {ViewStorage, IterViews} from "core/build_views"
import {build_views, remove_views} from "core/build_views"
import type {SerializableState} from "core/view"
import {isString} from "core/util/types"
import type * as p from "core/properties"

export class PaneView extends UIElementView {
  declare model: Pane

  protected get _ui_elements(): UIElement[] {
    return this.model.children.filter((child): child is UIElement => child instanceof UIElement)
  }

  protected readonly _child_views: ViewStorage<UIElement> = new Map()
  get child_views(): UIElementView[] {
    return this._ui_elements.map((child) => this._child_views.get(child)!)
  }

  override *children(): IterViews {
    yield* super.children()
    yield* this._child_views.values()
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._rebuild_views()
  }

  protected async _rebuild_views(): Promise<void> {
    await build_views(this._child_views, this._ui_elements, {parent: this})
  }

  override remove(): void {
    remove_views(this._child_views)
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()
    const {children} = this.model.properties
    this.on_change(children, () => {
      this._rebuild_views()
      this.render()
    })
  }

  override render(): void {
    super.render()

    for (const child of this.model.children) {
      if (isString(child)) {
        const text = document.createTextNode(child)
        this.shadow_el.append(text)
      } else {
        const child_view = this._child_views.get(child)!
        child_view.render()
        this.shadow_el.append(child_view.el)
        child_view.after_render()
      }
    }
  }

  override has_finished(): boolean {
    if (!super.has_finished()) {
      return false
    }

    for (const child_view of this.child_views) {
      if (!child_view.has_finished()) {
        return false
      }
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
    children: p.Property<(string | UIElement)[]>
  }
}

export interface Pane extends Pane.Attrs {}

export class Pane extends UIElement {
  declare properties: Pane.Props
  declare __view_type__: PaneView

  constructor(attrs?: Partial<Pane.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PaneView

    this.define<Pane.Props>(({String, Array, Ref, Or}) => ({
      children: [ Array(Or(String, Ref(UIElement))), [] ],
    }))
  }
}
