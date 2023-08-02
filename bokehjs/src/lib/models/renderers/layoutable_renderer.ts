import {CompositeRenderer, CompositeRendererView} from "../renderers/composite_renderer"
import type * as p from "core/properties"
import type {Layoutable} from "core/layout"
import type {SerializableState} from "core/view"
import type {BBox} from "core/util/bbox"
import {CanvasLayer} from "core/util/canvas"

export abstract class LayoutableRendererView extends CompositeRendererView {
  declare model: LayoutableRenderer
  declare layout: Layoutable

  override get bbox(): BBox {
    return this.layout.bbox
  }

  abstract get layoutables(): LayoutableRenderer[]

  get layoutable_views(): LayoutableRendererView[] {
    return this.layoutables
      .map((r) => this._renderer_views.get(r))
      .filter((rv): rv is LayoutableRendererView => rv instanceof LayoutableRendererView)
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

  export(type: "auto" | "png" | "svg" = "auto", hidpi: boolean = true): CanvasLayer {
    const output_backend = type == "auto" || type == "png" ? "canvas" : "svg"
    const canvas = new CanvasLayer(output_backend, hidpi)
    const {x, y, width, height} = this.bbox
    canvas.resize(width, height)
    const composite = this.canvas_view.compose()
    canvas.ctx.drawImage(composite.canvas, x, y, width, height, 0, 0, width, height)
    return canvas
  }
}

export namespace LayoutableRenderer {
  export type Attrs = p.AttrsOf<Props>
  export type Props = CompositeRenderer.Props
  export type Visuals = CompositeRenderer.Visuals
}

export interface LayoutableRenderer extends LayoutableRenderer.Attrs {}

export abstract class LayoutableRenderer extends CompositeRenderer {
  declare properties: LayoutableRenderer.Props
  declare __view_type__: LayoutableRendererView

  constructor(attrs?: Partial<LayoutableRenderer.Attrs>) {
    super(attrs)
  }
}
