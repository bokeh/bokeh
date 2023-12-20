import {UIElement, UIElementView} from "./ui_element"
import {DOMNode} from "../dom/dom_node"
import type {ViewStorage, BuildResult, IterViews, ViewOf} from "core/build_views"
import {build_views, remove_views} from "core/build_views"
import type {SerializableState} from "core/view"
import type * as p from "core/properties"
import {Ref, Or} from "core/kinds"

// TODO UIElement needs to inherit from DOMNode
const ElementLike = Or(Ref(UIElement), Ref(DOMNode))
type ElementLike = typeof ElementLike["__type__"]

export class PaneView extends UIElementView {
  declare model: Pane

  protected readonly _element_views: ViewStorage<ElementLike> = new Map()
  get element_views(): ViewOf<ElementLike>[] {
    return this.model.elements.map((element) => this._element_views.get(element)!)
  }

  override *children(): IterViews {
    yield* super.children()
    yield* this.element_views
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._build_elements()
  }

  protected async _build_elements(): Promise<BuildResult<ElementLike>> {
    return await build_views(this._element_views, this.model.elements, {parent: this})
  }

  protected async _update_elements(): Promise<void> {
    const {created} = await this._build_elements()
    const created_elements = new Set(created)

    if (created_elements.size != 0) {
      for (const element_view of this.element_views) {
        element_view.el.remove()
      }

      for (const element_view of this.element_views) {
        const is_new = created_elements.has(element_view)

        if (is_new) {
          element_view.render()
        }

        this.shadow_el.append(element_view.el)

        if (is_new) {
          element_view.after_render()
        }
      }
    }
  }

  override remove(): void {
    remove_views(this._element_views)
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()
    const {elements} = this.model.properties
    this.on_change(elements, async () => {
      await this._update_elements()
    })
  }

  override render(): void {
    super.render()

    for (const element_view of this.element_views) {
      element_view.render()
      this.shadow_el.append(element_view.el)
      element_view.after_render()
    }
  }

  override has_finished(): boolean {
    if (!super.has_finished()) {
      return false
    }

    for (const element_view of this.element_views) {
      if (!element_view.has_finished()) {
        return false
      }
    }

    return true
  }

  override serializable_state(): SerializableState {
    const {children, ...state} = super.serializable_state()
    return {
      ...state,
      children: [...children ?? [], ...this.element_views.map((element) => element.serializable_state())],
    }
  }
}

export namespace Pane {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    elements: p.Property<ElementLike[]>
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

    this.define<Pane.Props>(({Array}) => ({
      elements: [ Array(ElementLike), [] ],
    }))
  }
}
