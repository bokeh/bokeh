import {UIElement, UIElementView} from "./ui_element"
import {DOMNode} from "../dom/dom_node"
import {HTML} from "../dom/html"
import type {ViewStorage, BuildResult, IterViews, ViewOf} from "core/build_views"
import {build_views, remove_views} from "core/build_views"
import type * as p from "core/properties"
import {Ref, Or} from "core/kinds"

// TODO UIElement needs to inherit from DOMNode
export const ElementLike = Or(Ref(UIElement), Ref(DOMNode), Ref(HTML))
export type ElementLike = typeof ElementLike["__type__"]

export class PaneView extends UIElementView {
  declare model: Pane

  protected readonly _element_views: ViewStorage<ElementLike> = new Map()
  get elements(): ElementLike[] {
    return this.model.elements
  }
  get element_views(): ViewOf<ElementLike>[] {
    return this.elements.map((element) => this._element_views.get(element)).filter((view) => view != null)
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
    return await build_views(this._element_views, this.elements, {parent: this})
  }

  get self_target(): HTMLElement | ShadowRoot {
    return this.shadow_el
  }

  protected async _update_elements(): Promise<void> {
    const {created} = await this._build_elements()
    const created_elements = new Set(created)

    // First remove and then either reattach existing elements or render and
    // attach new elements, so that the order of children is consistent, while
    // avoiding expensive re-rendering of existing views.
    for (const element_view of this.element_views) {
      element_view.el.remove()
    }

    for (const element_view of this.element_views) {
      const is_new = created_elements.has(element_view)

      const target = element_view.rendering_target() ?? this.self_target
      if (is_new) {
        element_view.render_to(target)
      } else {
        target.append(element_view.el)
      }
    }
    this.r_after_render()
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
      const target = element_view.rendering_target() ?? this.self_target
      element_view.render_to(target)
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

    this.define<Pane.Props>(({List}) => ({
      elements: [ List(ElementLike), [] ],
    }))
  }
}
