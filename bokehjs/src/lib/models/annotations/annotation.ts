import {SidePanel} from "core/layout/side_panel"
import {Size} from "core/layout"
import {Arrayable} from "core/types"
import {SerializableState} from "core/view"
import * as p from "core/properties"
import * as proj from "core/util/projections"
import {max} from "core/util/array"

import {Renderer, RendererView} from "../renderers/renderer"
import {ColumnarDataSource} from "../sources/columnar_data_source"

export abstract class AnnotationView extends RendererView {
  model: Annotation

  layout: SidePanel

  get panel(): SidePanel | undefined { // XXX
    return this.layout
  }

  connect_signals(): void {
    super.connect_signals()

    const p = this.model.properties
    this.on_change(p.visible, () => this.plot_view.request_layout())
  }

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

  set_data(source: ColumnarDataSource): void {
    const self = this as any

    for (const prop of this.model) {
      if (!(prop instanceof p.VectorSpec))
        continue

      // this skips optional properties like radius for circles
      if (prop.optional && prop.spec.value == null && !prop.dirty)
        continue

      const array = prop.array(source)
      self[`_${prop.attr}`] = array
      if (prop instanceof p.DistanceSpec)
        self[`max_${prop.attr}`] = max(array as Arrayable<number>)
    }

    if (this.plot_model.use_map) {
      if (self._x != null)
        [self._x, self._y] = proj.project_xy(self._x, self._y)
      if (self._xs != null)
        [self._xs, self._ys] = proj.project_xsys(self._xs, self._ys)
    }
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
  export type Attrs = Renderer.Attrs

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
