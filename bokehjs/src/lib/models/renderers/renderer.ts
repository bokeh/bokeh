import {View} from "core/view"
import * as visuals from "core/visuals"
import {RenderLevel} from "core/enums"
import * as p from "core/properties"
import {BBox} from "core/util/bbox"
import {Model} from "../../model"
import {CanvasLayer} from "core/util/canvas"
import type {PlotView} from "../plots/plot"
import type {CanvasView} from "../canvas/canvas"
import {CoordinateTransform, CoordinateSystem, CoordinateMapping} from "../canvas/coordinates"
import {CartesianFrameView} from "../canvas/cartesian_frame"

export namespace RendererGroup {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    visible: p.Property<boolean>
  }
}

export interface RendererGroup extends RendererGroup.Attrs {}

export class RendererGroup extends Model {
  override properties: RendererGroup.Props

  constructor(attrs?: Partial<RendererGroup.Attrs>) {
    super(attrs)
  }

  static {
    this.define<RendererGroup.Props>(({Boolean}) => ({
      visible: [ Boolean, true ],
    }))
  }
}

export interface RenderingTarget {
  readonly canvas: CanvasView
  readonly bbox: BBox
  readonly screen: CoordinateSystem
  readonly view: CoordinateSystem
  readonly frame?: CartesianFrameView
  request_repaint(): void
  request_paint(to_invalidate: RendererView | RendererView[]): void
}

import {Range1d} from "../ranges/range1d"
import {LinearScale} from "../scales/linear_scale"

export function screen(bbox: BBox): CoordinateSystem {
  const {left, right, top, bottom} = bbox

  const x_source = new Range1d({start: left, end: right})
  const y_source = new Range1d({start: top, end: bottom})
  const x_target = new Range1d({start: left, end: right})
  const y_target = new Range1d({start: top, end: bottom})

  return {
    x_scale: new LinearScale({source_range: x_source, target_range: x_target}),
    y_scale: new LinearScale({source_range: y_source, target_range: y_target}),
    update(bbox: BBox) {
      const {left, right, top, bottom} = bbox
      this.x_scale.source_range.setv({start: left, end: right})
      this.y_scale.source_range.setv({start: top, end: bottom})
      this.x_scale.target_range.setv({start: left, end: right})
      this.y_scale.target_range.setv({start: top, end: bottom})
    },
  }
}

export function view(bbox: BBox): CoordinateSystem {
  const {left, right, top, bottom} = bbox

  const x_source = new Range1d({start: left, end: right})
  const y_source = new Range1d({start: top, end: bottom})
  const x_target = new Range1d({start: left, end: right})
  const y_target = new Range1d({start: bottom, end: top})

  return {
    x_scale: new LinearScale({source_range: x_source, target_range: x_target}),
    y_scale: new LinearScale({source_range: y_source, target_range: y_target}),
    update(bbox: BBox) {
      const {left, right, top, bottom} = bbox
      this.x_scale.source_range.setv({start: left, end: right})
      this.y_scale.source_range.setv({start: top, end: bottom})
      this.x_scale.target_range.setv({start: left, end: right})
      this.y_scale.target_range.setv({start: bottom, end: top})
    },
  }
}

export abstract class RendererView extends View implements visuals.Renderable {
  override model: Renderer
  visuals: Renderer.Visuals

  override readonly parent: View & RenderingTarget

  needs_webgl_blit: boolean

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
    this.needs_webgl_blit = false
  }

  override connect_signals(): void {
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
    const {frame} = this.parent
    if (coordinates != null) {
      return coordinates.get_transform(frame ?? this.canvas.screen)
    } else {
      const {x_range_name, y_range_name} = this.model
      if (frame != null) {
        const x_scale = frame.x_scales.get(x_range_name)!
        const y_scale = frame.y_scales.get(y_range_name)!
        return new CoordinateTransform(x_scale, y_scale)
      } else if (x_range_name != "default" || y_range_name != "default") {
        throw new Error("frame is required to resolve non-default ranges/scales")
      } else {
        const {x_scale, y_scale} = this.canvas.screen
        return new CoordinateTransform(x_scale, y_scale)
      }
    }
  }

  get plot_view(): PlotView {
    const {parent} = this
    if (parent == null)
      throw new Error("internal error")
    else if ("__plot__" in parent)
      return parent as PlotView
    else if ("plot_view" in parent)
      return parent.plot_view
    else
      return parent.parent
  }

  get layer(): CanvasLayer {
    const {overlays, primary} = this.canvas
    return this.model.level == "overlay" ? overlays : primary
  }

  get canvas(): CanvasView {
    return this.parent.canvas
  }

  request_render(): void {
    this.request_paint()
  }

  request_paint(): void {
    if (typeof this.plot_view?.request_paint !== "undefined")
      this.plot_view.request_paint(this)
    else
      this.canvas.paint_engine.request_paint(this)
  }

  request_layout(): void {
    this.plot_view.request_layout()
  }

  override notify_finished(): void {
    this.plot_view.notify_finished()
  }

  notify_finished_after_paint(): void {
    this.plot_view.notify_finished_after_paint()
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
  override properties: Renderer.Props
  override __view_type__: RendererView

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
    }))
  }
}
