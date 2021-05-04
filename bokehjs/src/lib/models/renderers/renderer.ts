import {View} from "core/view"
import * as visuals from "core/visuals"
import {RenderLevel} from "core/enums"
import * as p from "core/properties"
import {Model} from "../../model"
import {CanvasLayer} from "core/util/canvas"
import type {Plot, PlotView} from "../plots/plot"
import type {CanvasView} from "../canvas/canvas"
import {CoordinateTransform, CoordinateMapping} from "../canvas/coordinates"

export namespace RendererGroup {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    visible: p.Property<boolean>
  }
}

export interface RendererGroup extends RendererGroup.Attrs {}

export class RendererGroup extends Model {
  properties: RendererGroup.Props

  constructor(attrs?: Partial<RendererGroup.Attrs>) {
    super(attrs)
  }

  static init_RendererGroup(): void {
    this.define<RendererGroup.Props>(({Boolean}) => ({
      visible: [ Boolean, true ],
    }))
  }
}

export abstract class RendererView extends View implements visuals.Renderable {
  model: Renderer
  visuals: Renderer.Visuals

  readonly parent: PlotView

  needs_webgl_blit: boolean

  private _coordinates?: CoordinateTransform
  get coordinates(): CoordinateTransform {
    const {_coordinates} = this
    if (_coordinates != null)
      return _coordinates
    else
      return this._coordinates = this._initialize_coordinates()
  }

  initialize(): void {
    super.initialize()
    this.visuals = new visuals.Visuals(this)
    this.needs_webgl_blit = false
  }

  connect_signals(): void {
    super.connect_signals()
    const {x_range_name, y_range_name} = this.model.properties
    this.on_change([x_range_name, y_range_name], () => this._initialize_coordinates())
    const {group} = this.model
    if (group != null) {
      this.on_change(group.properties.visible, () => {
        this.model.visible = group.visible
      })
    }
  }

  protected _initialize_coordinates(): CoordinateTransform {
    const {coordinates} = this.model
    const {frame} = this.plot_view
    if (coordinates != null) {
      return coordinates.get_transform(frame)
    } else {
      const {x_range_name, y_range_name} = this.model
      const x_scale = frame.x_scales.get(x_range_name)!
      const y_scale = frame.y_scales.get(y_range_name)!
      return new CoordinateTransform(x_scale, y_scale)
    }
  }

  get plot_view(): PlotView {
    return this.parent
  }

  get plot_model(): Plot {
    return this.parent.model
  }

  get layer(): CanvasLayer {
    const {overlays, primary} = this.canvas
    return this.model.level == "overlay" ? overlays : primary
  }

  get canvas(): CanvasView {
    return this.plot_view.canvas_view
  }

  request_render(): void {
    this.request_paint()
  }

  request_paint(): void {
    this.plot_view.request_paint(this)
  }

  notify_finished(): void {
    this.plot_view.notify_finished()
  }

  interactive_hit?(sx: number, sy: number): boolean

  get needs_clip(): boolean {
    return false
  }

  get has_webgl(): boolean {
    return false
  }

  /*
  get visible(): boolean {
    const {visible, group} = this.model
    return !visible ? false : (group?.visible ?? true)
  }
  */

  render(): void {
    if (this.model.visible) {
      this._render()
    }
    this._has_finished = true
  }

  protected abstract _render(): void

  renderer_view<T extends Renderer>(_renderer: T): T["__view_type__"] | undefined {
    return undefined
  }
}

export namespace Renderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    group: p.Property<RendererGroup | null>
    level: p.Property<RenderLevel>
    visible: p.Property<boolean>
    x_range_name: p.Property<string>
    y_range_name: p.Property<string>
    coordinates: p.Property<CoordinateMapping | null>
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
    this.define<Renderer.Props>(({Boolean, String, Ref, Nullable}) => ({
      group:        [ Nullable(Ref(RendererGroup)), null ],
      level:        [ RenderLevel, "image" ],
      visible:      [ Boolean, true ],
      x_range_name: [ String, "default" ],
      y_range_name: [ String, "default" ],
      coordinates:  [ Nullable(Ref(CoordinateMapping)), null ],
    }))
  }
}
