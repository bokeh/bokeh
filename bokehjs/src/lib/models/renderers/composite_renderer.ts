import {Renderer, RendererView} from "./renderer"
import {UIElement} from "../ui/ui_element"
import {DOMNode} from "../dom/dom_node"
import type {ViewStorage, BuildResult, IterViews, ViewOf} from "core/build_views"
import {build_views, remove_views} from "core/build_views"
import type {SerializableState} from "core/view"
import type * as p from "core/properties"
import {Ref, Or} from "core/kinds"

// TODO UIElement needs to inherit from DOMNode
const ElementLike = Or(Ref(UIElement), Ref(DOMNode))
type ElementLike = typeof ElementLike["__type__"]

export abstract class CompositeRendererView extends RendererView {
  declare model: CompositeRenderer

  protected readonly _renderer_views: ViewStorage<Renderer> = new Map()
  get renderer_views(): ViewOf<Renderer>[] {
    return this.model.renderers.map((renderer) => this._renderer_views.get(renderer)!)
  }

  protected readonly _element_views: ViewStorage<ElementLike> = new Map()
  get element_views(): ViewOf<ElementLike>[] {
    return this.model.elements.map((element) => this._element_views.get(element)!)
  }

  override *children(): IterViews {
    yield* super.children()
    yield* this.renderer_views
    yield* this.element_views
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._build_renderers()
    await this._build_elements()
  }

  protected async _build_renderers(): Promise<BuildResult<Renderer>> {
    return await build_views(this._renderer_views, this.model.renderers, {parent: this.plot_view})
  }

  protected async _build_elements(): Promise<BuildResult<ElementLike>> {
    return await build_views(this._element_views, this.model.elements, {parent: this.plot_view})
  }

  protected async _update_renderers(): Promise<void> {
    await this._build_renderers()
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

      if (is_new) {
        element_view.render_to(this.plot_view.shadow_el)
      } else {
        this.plot_view.shadow_el.append(element_view.el)
      }
    }
  }

  override remove(): void {
    remove_views(this._renderer_views)
    remove_views(this._element_views)
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()
    const {renderers, elements} = this.model.properties
    this.on_change(renderers, async () => {
      await this._update_renderers()
    })
    this.on_change(elements, async () => {
      await this._update_elements()
    })
  }

  private _has_rendered_elements: boolean = false

  override paint(): void {
    if (!this._has_rendered_elements) {
      for (const element_view of this.element_views) {
        element_view.render_to(this.plot_view.shadow_el)
      }
      this._has_rendered_elements = true
    }

    super.paint()

    const {displayed} = this
    for (const element_view of this.element_views) {
      element_view.reposition(displayed)
    }
  }

  override has_finished(): boolean {
    if (!super.has_finished()) {
      return false
    }

    for (const renderer_view of this.renderer_views) {
      if (!renderer_view.has_finished()) {
        return false
      }
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
      children: [
        ...children ?? [],
        ...this.renderer_views.map((renderer) => renderer.serializable_state()),
        ...this.element_views.map((element) => element.serializable_state()),
      ],
    }
  }
}

export namespace CompositeRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Renderer.Props & {
    renderers: p.Property<Renderer[]>
    elements: p.Property<ElementLike[]>
  }

  export type Visuals = Renderer.Visuals
}

export interface CompositeRenderer extends CompositeRenderer.Attrs {}

export abstract class CompositeRenderer extends Renderer {
  declare properties: CompositeRenderer.Props
  declare __view_type__: CompositeRendererView

  constructor(attrs?: Partial<CompositeRenderer.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CompositeRenderer.Props>(({List, Ref}) => ({
      renderers: [ List(Ref(Renderer)), [] ],
      elements: [ List(ElementLike), [] ],
    }))
  }
}
