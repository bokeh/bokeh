import {Renderer, RendererView} from "../renderers/renderer"
import type * as p from "core/properties"
import type {ViewStorage, IterViews} from "core/build_views"
import {build_views, remove_views} from "core/build_views"
import type {SerializableState} from "core/view"
import {isNotNull} from "core/util/types"

export abstract class CompositeRendererView extends RendererView {
  declare model: CompositeRenderer

  abstract get renderers(): Renderer[]

  get renderer_views(): RendererView[] {
    return this.renderers.map((renderer) => this._renderer_views.get(renderer)).filter(isNotNull)
  }

  protected readonly _renderer_views: ViewStorage<Renderer> = new Map()

  override renderer_view<T extends Renderer>(renderer: T): T["__view_type__"] | undefined {
    return this._renderer_views.get(renderer)
  }

  override *children(): IterViews {
    yield* super.children()
    yield* this._renderer_views.values()
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await build_views(this._renderer_views, this.renderers, {parent: this})
  }

  override remove(): void {
    remove_views(this._renderer_views)
    super.remove()
  }

  override serializable_state(): SerializableState {
    const {children, ...state} = super.serializable_state()
    const renderers = this.renderer_views
      .filter((view) => view.model.syncable)
      .map((view) => view.serializable_state())
    return {...state, children: [...children ?? [], ...renderers]}
  }
}

export namespace CompositeRenderer {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Renderer.Props
  export type Visuals = Renderer.Visuals
}

export interface CompositeRenderer extends CompositeRenderer.Attrs {}

export abstract class CompositeRenderer extends Renderer {
  declare properties: CompositeRenderer.Props
  declare __view_type__: CompositeRendererView

  constructor(attrs?: Partial<CompositeRenderer.Attrs>) {
    super(attrs)
  }
}
