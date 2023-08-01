import {View} from "core/view"
import * as visuals from "core/visuals"
import {RenderLevel} from "core/enums"
import type * as p from "core/properties"
import {Model} from "../../model"
import type {CanvasLayer} from "core/util/canvas"
import {assert} from "core/util/assert"
import type {PlotView} from "../plots/plot"
import type {PlotRendererView} from "../plots/plot_renderer"
import type {CanvasView} from "../canvas/canvas"
import {CoordinateTransform, CoordinateMapping} from "../coordinates/coordinate_mapping"
import type {CartesianFrameView} from "../canvas/cartesian_frame"

export namespace RendererGroup {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    visible: p.Property<boolean>
  }
}

export interface RendererGroup extends RendererGroup.Attrs {}

export class RendererGroup extends Model {
  declare properties: RendererGroup.Props

  constructor(attrs?: Partial<RendererGroup.Attrs>) {
    super(attrs)
  }

  static {
    this.define<RendererGroup.Props>(({Boolean}) => ({
      visible: [ Boolean, true ],
    }))
  }
}

export abstract class RendererView extends View implements visuals.Renderable {
  declare model: Renderer
  visuals: Renderer.Visuals

  declare readonly parent: PlotView | CanvasView | RendererView

  protected _coordinates?: CoordinateTransform
  get coordinates(): CoordinateTransform {
    const {_coordinates} = this
    if (_coordinates != null)
      return _coordinates
    else
      return this._coordinates = this._initialize_coordinates()
  }

  override initialize(): void {
    super.initialize()
    this.visuals = new visuals.Visuals(this)
  }

  override connect_signals(): void {
    super.connect_signals()

    const {group} = this.model
    if (group != null) {
      this.on_change(group.properties.visible, () => {
        this.model.visible = group.visible
      })
    }

    const {x_range_name, y_range_name} = this.model.properties
    this.on_change([x_range_name, y_range_name], () => delete this._coordinates)
    if (this.model.type != "CartesianFrame") {
      const {type} = this.parent.model
      if (type == "PlotView" || type == "PlotRenderer") {
        this.connect(this.plot_view.frame.model.change, () => delete this._coordinates)
      }
    }
  }

  protected _initialize_coordinates(): CoordinateTransform {
    const {coordinates} = this.model
    if ("frame_view" in this.parent) {
      const {frame_view} = this.parent
      if (coordinates != null) {
        return coordinates.get_transform(frame_view)
      } else {
        const {x_range_name, y_range_name} = this.model
        const x_scale = frame_view.x_scales.get(x_range_name)
        const y_scale = frame_view.y_scales.get(y_range_name)
        assert(x_scale != null, `missing '${x_range_name}' range`)
        assert(y_scale != null, `missing '${y_range_name}' range`)
        return new CoordinateTransform(x_scale, y_scale)
      }
    }
    throw new Error("nope")
  }

  get frame_view(): CartesianFrameView {
    if ("frame_view" in this.parent)
      return this.parent.frame_view as CartesianFrameView
    else
      throw new Error("frame_view: nope")
  }

  get plot_view(): PlotRendererView {
    return (this.parent as any).plot_view
    //const {parent} = this
    //assert(parent.model.type != "Canvas") // XXX avoid cyclic dependency
    //return parent as PlotView | PlotRendererView
  }

  get layer(): CanvasLayer {
    const {overlays, primary} = this.canvas
    return this.model.level == "overlay" ? overlays : primary
  }

  get canvas(): CanvasView {
    return this.parent.canvas_view
  }

  get canvas_view(): CanvasView {
    return this.canvas
  }

  request_render(): void {
    this.request_paint()
  }

  request_paint(to_invalidate: RendererView[] | RendererView = this): void {
    this.canvas_view.request_paint(to_invalidate)
  }

  request_layout(): void {
    this.canvas_view.request_layout()
  }

  override notify_finished(): void {
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

  get displayed(): boolean {
    return this.model.visible
  }

  render(): void {
    if (this.displayed) {
      this._render()
    }
    this._has_finished = true
  }

  protected abstract _render(): void

  renderer_view<T extends Renderer>(_renderer: T): T["__view_type__"] | undefined {
    return undefined
  }

  /**
   * Geometry setup that doesn't change between paints.
   */
  update_geometry(): void {}

  /**
   * Geometry setup that changes between paints.
   */
  compute_geometry(): void {}
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
    propagate_hover: p.Property<boolean>
  }

  export type Visuals = visuals.Visuals
}

export interface Renderer extends Renderer.Attrs {}

export abstract class Renderer extends Model {
  declare properties: Renderer.Props
  declare __view_type__: RendererView

  constructor(attrs?: Partial<Renderer.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Renderer.Props>(({Boolean, String, Ref, Nullable}) => ({
      group:        [ Nullable(Ref(RendererGroup)), null ],
      level:        [ RenderLevel, "image" ],
      visible:      [ Boolean, true ],
      x_range_name: [ String, "default" ],
      y_range_name: [ String, "default" ],
      coordinates:  [ Nullable(Ref(CoordinateMapping)), null ],
      propagate_hover: [ Boolean, false ],
    }))
  }
}
