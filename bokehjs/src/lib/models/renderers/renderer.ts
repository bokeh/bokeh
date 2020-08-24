import {View} from "core/view"
import * as visuals from "core/visuals"
import {RenderLevel} from "core/enums"
import * as p from "core/properties"
import {Model} from "../../model"
import {BBox} from "core/util/bbox"

import type {Plot, PlotView} from "../plots/plot"
import type {CanvasLayer} from "../canvas/canvas"
import {CoordinateTransform} from "../canvas/coordinates"

export abstract class RendererView extends View {
  model: Renderer
  visuals: Renderer.Visuals

  parent: PlotView

  needs_webgl_blit: boolean

  private _coordinates: CoordinateTransform
  get coordinates(): CoordinateTransform {
    return this._coordinates
  }

  initialize(): void {
    super.initialize()
    this.visuals = new visuals.Visuals(this.model)
    this.needs_webgl_blit = false
    this._initialize_coordinates()
  }

  connect_signals(): void {
    super.connect_signals()
    const {x_range_name, y_range_name} = this.model.properties
    this.on_change([x_range_name, y_range_name], () => this._initialize_coordinates())
  }

  protected _initialize_coordinates(): void {
    const {x_range_name, y_range_name} = this.model
    const {frame} = this.plot_view
    const x_scale = frame.x_scales.get(x_range_name)!
    const y_scale = frame.y_scales.get(y_range_name)!
    this._coordinates = new CoordinateTransform(x_scale, y_scale)
  }

  get plot_view(): PlotView {
    return this.parent
  }

  get plot_model(): Plot {
    return this.parent.model
  }

  get layer(): CanvasLayer {
    const {overlays, primary} = this.plot_view.canvas_view
    return this.model.level == "overlay" ? overlays : primary
  }

  request_render(): void {
    this.plot_view.request_render()
  }

  notify_finished(): void {
    this.plot_view.notify_finished()
  }

  interactive_bbox?(sx: number, sy: number): BBox

  interactive_hit?(sx: number, sy: number): boolean

  get needs_clip(): boolean {
    return false
  }

  get has_webgl(): boolean {
    return false
  }

  render(): void {
    if (this.model.visible) {
      this._render()
    }
    this._has_finished = true
  }

  protected abstract _render(): void
}

export namespace Renderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    level: p.Property<RenderLevel>
    visible: p.Property<boolean>
    x_range_name: p.Property<string>
    y_range_name: p.Property<string>
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
      level:        [ p.RenderLevel            ],
      visible:      [ p.Boolean,     true      ],
      x_range_name: [ p.String,      "default" ],
      y_range_name: [ p.String,      "default" ],
    })
  }
}
