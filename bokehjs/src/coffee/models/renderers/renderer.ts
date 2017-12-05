import {DOMView} from "core/dom_view"
import * as visuals from "core/visuals"
import {RenderLevel} from "core/enums"
import * as p from "core/properties"
import * as proj from "core/util/projections"
import {extend} from "core/util/object"
import {Model} from "../../model"

import {PlotCanvas, PlotCanvasView} from "../plots/plot_canvas"
import {ColumnarDataSource} from "../sources/columnar_data_source"

// This shouldn't be a DOMView, but annotations create a mess.
export abstract class RendererView extends DOMView {

  model: Renderer

  visuals: Renderer.Visuals

  plot_view: PlotCanvasView

  initialize(options: any): void {
    super.initialize(options)
    this.plot_view = options.plot_view
    this.visuals = new visuals.Visuals(this.model)
    this._has_finished = true // XXX: should be in render() but subclasses don't respect super()
  }

  get plot_model(): PlotCanvas {
    return this.plot_view.model
  }

  request_render(): void {
    this.plot_view.request_render()
  }

  set_data(source: ColumnarDataSource): void {
    const data = this.model.materialize_dataspecs(source)
    extend(this as any, data)

    if (this.plot_model.use_map) {
      const self: any = this
      if (self._x != null)
        [self._x, self._y] = proj.project_xy(self._x, self._y)
      if (self._xs != null)
        [self._xs, self._ys] = proj.project_xsys(self._xs, self._ys)
    }
  }

  map_to_screen(x: number[], y: number[]): [number[], number[]] {
    return this.plot_view.map_to_screen(x, y, (this.model as any).x_range_name, (this.model as any).y_range_name)
  }
}

export abstract class Renderer extends Model {
  level: RenderLevel
  visible: boolean
}

Renderer.prototype.type = "Renderer"

Renderer.define({
  level: [ p.RenderLevel ],
  visible: [ p.Bool, true ],
})

export module Renderer {
  export type Visuals = visuals.Visuals
}
