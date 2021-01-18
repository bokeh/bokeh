import {Renderer, RendererView} from "../renderers/renderer"

import {Panel} from "core/layout/side_panel"
import {Size, Layoutable} from "core/layout"
import {SerializableState} from "core/view"
import * as p from "core/properties"

export abstract class AnnotationView extends RendererView {
  model: Annotation

  layout?: Layoutable
  panel?: Panel

  update_layout?(): void
  after_layout?(): void

  get_size(): Size {
    if (this.model.visible) {
      const {width, height} = this._get_size()
      return {width: Math.round(width), height: Math.round(height)}
    } else
      return {width: 0, height: 0}
  }

  protected _get_size(): Size {
    throw new Error("not implemented")
  }

  connect_signals(): void {
    super.connect_signals()

    const p = this.model.properties
    this.on_change(p.visible, () => {
      if (this.layout != null) {
        this.layout.visible = this.model.visible
        this.plot_view.request_layout()
      }
    })
  }

  get needs_clip(): boolean {
    return this.layout == null // TODO: change this, when center layout is fully implemented
  }

  serializable_state(): SerializableState {
    const state = super.serializable_state()
    return this.layout == null ? state : {...state, bbox: this.layout.bbox.box}
  }
}

export namespace Annotation {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Renderer.Props

  export type Visuals = Renderer.Visuals
}

export interface Annotation extends Annotation.Attrs {}

export abstract class Annotation extends Renderer {
  properties: Annotation.Props
  __view_type__: AnnotationView

  constructor(attrs?: Partial<Annotation.Attrs>) {
    super(attrs)
  }

  static init_Annotation(): void {
    this.override<Annotation.Props>({
      level: 'annotation',
    })
  }
}
