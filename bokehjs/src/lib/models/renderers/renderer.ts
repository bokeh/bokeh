import {View} from "core/view"
import * as visuals from "core/visuals"
import {RenderLevel} from "core/enums"
import {Arrayable} from "core/types"
import * as p from "core/properties"
import {Model} from "../../model"
import {BBox} from "core/util/bbox"

import {Plot, PlotView} from "../plots/plot"
import {CanvasLayer} from "../canvas/canvas"

export abstract class RendererView extends View {
  model: Renderer
  visuals: Renderer.Visuals

  parent: PlotView

  initialize(): void {
    super.initialize()
    this.visuals = new visuals.Visuals(this.model)
    this._has_finished = true // XXX: should be in render() but subclasses don't respect super()
  }

  get plot_view(): PlotView {
    return this.parent
  }

  get plot_model(): Plot {
    return this.parent.model
  }

  get layer(): CanvasLayer {
    const {canvas_view} = this.plot_view
    return this.model.level == "overlay" ? canvas_view.overlays : canvas_view.primary
  }

  request_render(): void {
    this.plot_view.request_render()
  }

  notify_finished(): void {
    this.plot_view.notify_finished()
  }

  map_to_screen(x: Arrayable<number>, y: Arrayable<number>): [Arrayable<number>, Arrayable<number>] {
    return this.plot_view.map_to_screen(x, y, (this.model as any).x_range_name, (this.model as any).y_range_name)
  }

  interactive_bbox?(sx: number, sy: number): BBox

  interactive_hit?(sx: number, sy: number): boolean

  get needs_clip(): boolean {
    return false
  }

  get has_webgl(): boolean {
    return false
  }

  render(): void {}
}

export namespace Renderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    level: p.Property<RenderLevel>
    visible: p.Property<boolean>
  }

  export type Visuals = visuals.Visuals
}

export interface Renderer extends Renderer.Attrs {}

export abstract class Renderer extends Model {
  properties: Renderer.Props
  __view_type__: RendererView

  constructor(attrs?: Partial<Renderer.Attrs>) {
    super(attrs)
  }

  static init_Renderer(): void {
    this.define<Renderer.Props>({
      level: [ p.RenderLevel ],
      visible: [ p.Boolean, true ],
    })
  }
}
