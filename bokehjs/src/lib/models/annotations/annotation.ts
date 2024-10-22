import {CompositeRenderer, CompositeRendererView} from "../renderers/composite_renderer"
import type {Size} from "core/layout"
import type {BBox} from "core/util/bbox"
import type * as p from "core/properties"

export abstract class AnnotationView extends CompositeRendererView {
  declare model: Annotation

  update_layout?(): void
  after_layout?(): void

  override get bbox(): BBox | undefined {
    return super.bbox ?? this.layout?.bbox
  }

  get_size(): Size {
    if (this.displayed) {
      const {width, height} = this._get_size()
      return {width: Math.round(width), height: Math.round(height)}
    } else {
      return {width: 0, height: 0}
    }
  }

  protected _get_size(): Size {
    throw new Error("not implemented")
  }

  override connect_signals(): void {
    super.connect_signals()

    const p = this.model.properties
    this.on_change(p.visible, () => {
      if (this.layout != null) {
        this.layout.visible = this.model.visible
        this.plot_view.request_layout()
      }
    })
  }

  override get needs_clip(): boolean {
    return this.layout == null // TODO: change this, when center layout is fully implemented
  }
}

export namespace Annotation {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CompositeRenderer.Props

  export type Visuals = CompositeRenderer.Visuals
}

export interface Annotation extends Annotation.Attrs {}

export abstract class Annotation extends CompositeRenderer {
  declare properties: Annotation.Props
  declare __view_type__: AnnotationView

  constructor(attrs?: Partial<Annotation.Attrs>) {
    super(attrs)
  }

  static {
    this.override<Annotation.Props>({
      level: "annotation",
    })
  }
}
