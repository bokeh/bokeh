import {DOMView} from "core/dom_view"
import * as visuals from "core/visuals"
import {RenderLevel} from "core/enums"
import {Arrayable} from "core/types"
import * as p from "core/properties"
import {Model} from "../../model"
import {BBox} from "core/util/bbox"

import {PlotCanvas, PlotCanvasView} from "../plots/plot_canvas"

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

  map_to_screen(x: Arrayable<number>, y: Arrayable<number>): [Arrayable<number>, Arrayable<number>] {
    return this.plot_view.map_to_screen(x, y, (this.model as any).x_range_name, (this.model as any).y_range_name)
  }

  interactive_bbox?(sx: number, sy: number): BBox

  interactive_hit?(sx: number, sy: number): boolean

  get needs_clip(): boolean {
    return false
  }
}

export namespace Renderer {
  export interface Attrs extends Model.Attrs {
    level: RenderLevel
    visible: boolean
  }

  export interface Props extends Model.Props {
    level: p.Property<RenderLevel>
    visible: p.Property<boolean>
  }

  export type Visuals = visuals.Visuals
}

export interface Renderer extends Renderer.Attrs {}

export abstract class Renderer extends Model {

  properties: Renderer.Props

  constructor(attrs?: Partial<Renderer.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Renderer"

    this.define({
      level: [ p.RenderLevel ],
      visible: [ p.Bool, true ],
    })
  }
}
Renderer.initClass()
