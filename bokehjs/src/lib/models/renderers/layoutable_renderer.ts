import {Renderer, RendererView} from "../renderers/renderer"
import type * as p from "core/properties"
import type {Layoutable} from "core/layout"
import type {ViewStorage, IterViews} from "core/build_views"
import {build_views, remove_views} from "core/build_views"
import type {SerializableState} from "core/view"
import {isNotNull} from "core/util/types"
import type {BBox} from "core/util/bbox"

export abstract class LayoutableRendererView extends RendererView {
  declare model: LayoutableRenderer
  declare layout: Layoutable

  get bbox(): BBox {
    return this.layout.bbox
  }

  abstract get layoutables(): LayoutableRenderer[]

  get layoutable_views(): LayoutableRendererView[] {
    return this.layoutables.map((renderer) => this._renderer_views.get(renderer)).filter(isNotNull)
  }

  override *children(): IterViews {
    yield* super.children()
    yield* this.layoutable_views
  }

  protected readonly _renderer_views: ViewStorage<LayoutableRenderer> = new Map()

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await build_views(this._renderer_views, this.layoutables, {parent: this})
  }

  override remove(): void {
    remove_views(this._renderer_views)
    super.remove()
  }

  abstract _update_layout(): void
  abstract _after_layout(): void

  update_layout(): void {
    for (const renderer_view of this.layoutable_views) {
      renderer_view.update_layout()
    }

    this._update_layout()
  }

  after_layout(): void {
    for (const renderer_view of this.layoutable_views) {
      renderer_view.after_layout()
    }

    this._after_layout()
  }

  override serializable_state(): SerializableState {
    const {bbox} = this
    return {...super.serializable_state(), bbox}
  }
}

export namespace LayoutableRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Renderer.Props & {
  }

  export type Visuals = Renderer.Visuals
}

export interface LayoutableRenderer extends LayoutableRenderer.Attrs {}

export abstract class LayoutableRenderer extends Renderer {
  declare properties: LayoutableRenderer.Props
  declare __view_type__: LayoutableRendererView

  constructor(attrs?: Partial<LayoutableRenderer.Attrs>) {
    super(attrs)
  }

  static {
    this.define<LayoutableRenderer.Props>(({}) => ({
    }))
  }
}
