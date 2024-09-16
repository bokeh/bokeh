import {Renderer, RendererView} from "./renderer"
import {UIElement} from "../ui/ui_element"
import {DOMNode} from "../dom/dom_node"
import type {ViewStorage, BuildResult, IterViews, ViewOf} from "core/build_views"
import {build_views, remove_views} from "core/build_views"
import type * as p from "core/properties"
import {Ref, Or} from "core/kinds"
import type {Context2d} from "core/util/canvas"

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

  protected readonly _computed_renderers: Renderer[] = []
  get computed_renderers(): Renderer[] {
    return [...this.model.renderers, ...this._computed_renderers]
  }
  get computed_renderer_views(): ViewOf<Renderer>[] {
    return this.computed_renderers.map((item) => this._renderer_views.get(item)).filter((rv) => rv != null)
  }

  protected async _build_renderers(): Promise<BuildResult<Renderer>> {
    return await build_views(this._renderer_views, this.computed_renderers, {parent: this.plot_view})
  }

  protected readonly _computed_elements: ElementLike[] = []
  get computed_elements(): ElementLike[] {
    return [...this.model.elements, ...this._computed_elements]
  }
  get computed_element_views(): ViewOf<ElementLike>[] {
    return this.computed_elements.map((item) => this._element_views.get(item)).filter((ev) => ev != null)
  }

  protected async _build_elements(): Promise<BuildResult<ElementLike>> {
    return await build_views(this._element_views, this.computed_elements, {parent: this.plot_view})
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

      const target = element_view.rendering_target() ?? this.shadow_el
      if (is_new) {
        element_view.render_to(target)
      } else {
        target.append(element_view.el)
      }
    }
    this.r_after_render()
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

  override paint(ctx: Context2d): void {
    if (!this._has_rendered_elements) {
      for (const element_view of this.element_views) {
        const target = element_view.rendering_target() ?? this.shadow_el
        element_view.render_to(target)
      }
      this._has_rendered_elements = true
    }

    super.paint(ctx)

    if (this.displayed && this.is_renderable) {
      for (const renderer of this.computed_renderer_views) {
        renderer.paint(ctx)
      }
    }

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
