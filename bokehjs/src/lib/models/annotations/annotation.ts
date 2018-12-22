import {SidePanel} from "core/layout/side_panel"
import {Size} from "core/layout"
import * as proj from "core/util/projections"
import {extend} from "core/util/object"
import {Context2d} from "core/util/canvas"

import {Renderer, RendererView} from "../renderers/renderer"
import {ColumnarDataSource} from "../sources/columnar_data_source"

export abstract class AnnotationView extends RendererView {
  model: Annotation

  layout: SidePanel

  get panel(): SidePanel | undefined { // XXX
    return this.layout
  }

  protected _get_size(): Size {
    throw new Error("not implemented")
  }

  get_size(): Size {
    if (this.model.visible) {
      const {width, height} = this._get_size()
      return {width: Math.round(width), height: Math.round(height)}
    } else
      return {width: 0, height: 0}
  }

  get ctx(): Context2d {
    return this.plot_view.canvas_view.ctx
  }

  set_data(source: ColumnarDataSource): void {
    const data = this.model.materialize_dataspecs(source)
    extend(this as any, data)

    if (this.plot_model.use_map) {
      const self = this as any
      if (self._x != null)
        [self._x, self._y] = proj.project_xy(self._x, self._y)
      if (self._xs != null)
        [self._xs, self._ys] = proj.project_xsys(self._xs, self._ys)
    }
  }

  get needs_clip(): boolean {
    return this.layout == null // TODO: change this, when center layout is fully implemented
  }

  serializable_state(): {[key: string]: unknown} {
    const state = super.serializable_state()
    return this.layout == null ? state : {...state, bbox: this.layout.bbox.rect}
  }
}

export namespace Annotation {
  export interface Attrs extends Renderer.Attrs {}

  export interface Props extends Renderer.Props {}

  export type Visuals = Renderer.Visuals
}

export interface Annotation extends Annotation.Attrs {}

export abstract class Annotation extends Renderer {

  properties: Annotation.Props

  constructor(attrs?: Partial<Annotation.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Annotation'

    this.override({
      level: 'annotation',
    })
  }
}
Annotation.initClass()
