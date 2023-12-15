import {View} from "core/view"
import * as visuals from "core/visuals"
import {RenderLevel} from "core/enums"
import type * as p from "core/properties"
import {isString} from "core/util/types"
import {Model} from "../../model"
import type {CanvasLayer} from "core/util/canvas"
import {assert} from "core/util/assert"
import type {Plot, PlotView} from "../plots/plot"
import type {CanvasView} from "../canvas/canvas"
import {CoordinateTransform, CoordinateMapping} from "../coordinates/coordinate_mapping"
import type {Node} from "../coordinates/node"
import {BBox} from "core/util/bbox"
import {LinearScale} from "../scales/linear_scale"
import {Range1d} from "../ranges/range1d"

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

  declare readonly parent: PlotView | RendererView

  protected _coordinates?: CoordinateTransform
  get coordinates(): CoordinateTransform {
    const {_coordinates} = this
    if (_coordinates != null)
      return _coordinates
    else
      return this._coordinates = this._initialize_coordinates()
  }

  private _custom_coordinates: CoordinateTransform | null = null
  set coordinates(custom_coordinates: CoordinateTransform | null) {
    this._custom_coordinates = custom_coordinates
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
    this.connect(this.plot_view.frame.change, () => delete this._coordinates)
  }

  protected _initialize_coordinates(): CoordinateTransform {
    if (this._custom_coordinates != null) {
      return this._custom_coordinates
    }
    const {coordinates} = this.model
    const {frame, canvas} = this.plot_view
    if (coordinates instanceof CoordinateMapping) {
      return coordinates.get_transform(frame)
    } else if (coordinates == "screen") {
      // TODO no-op scale
      const x_range = new Range1d(canvas.bbox.x_range)
      const y_range = new Range1d(canvas.bbox.y_range)
      const x_scale = new LinearScale({source_range: x_range, target_range: x_range})
      const y_scale = new LinearScale({source_range: y_range, target_range: y_range})
      return new CoordinateTransform(x_scale, y_scale)
    } else {
      const {x_range_name, y_range_name} = this.model
      const x_scale = frame.x_scales.get(x_range_name)
      const y_scale = frame.y_scales.get(y_range_name)
      assert(x_scale != null, `missing '${x_range_name}' range`)
      assert(y_scale != null, `missing '${y_range_name}' range`)
      return new CoordinateTransform(x_scale, y_scale)
    }
  }

  get plot_view(): PlotView {
    const {parent} = this
    if (parent instanceof RendererView)
      return parent.plot_view
    else
      return parent
  }

  get plot_model(): Plot {
    return this.plot_view.model
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

  /**
   * Geometry setup that doesn't change between paints.
   */
  update_geometry(): void {}

  /**
   * Geometry setup that changes between paints.
   */
  compute_geometry(): void {}

  /**
   * Compute screen coordinates for a symbolic node.
   */
  resolve_node(node: Node): {x: number, y: number} {
    const target = (() => {
      if (isString(node.target)) {
        switch (node.target) {
          case "canvas": return this.plot_view.canvas
          case "frame":  return this.plot_view.frame
          case "plot":   return this.plot_view
          case "parent": return this.parent
        }
      } else {
        if (node.target instanceof Renderer) {
          const view = this.plot_view.renderer_view(node.target)
          if (view != null) {
            return view
          }
        }
        return null
      }
    })()

    function xy(x: number, y: number) {
      const {offset} = node
      return {x: x + offset, y: y + offset}
    }

    if (target == null) {
      return xy(NaN, NaN)
    }

    if (!("bbox" in target && target.bbox instanceof BBox)) {
      return xy(NaN, NaN)
    }

    const {bbox} = target
    switch (node.symbol) {
      case "top_left":   return xy(bbox.left, bbox.top)
      case "top_center": return xy(bbox.hcenter, bbox.top)
      case "top_right":  return xy(bbox.right, bbox.top)

      case "center_left":   return xy(bbox.left, bbox.vcenter)
      case "center_center": return xy(bbox.hcenter, bbox.vcenter)
      case "center_right":  return xy(bbox.right, bbox.vcenter)

      case "bottom_left":   return xy(bbox.left, bbox.bottom)
      case "bottom_center": return xy(bbox.hcenter, bbox.bottom)
      case "bottom_right":  return xy(bbox.right, bbox.bottom)

      case "center": return xy(bbox.hcenter, bbox.vcenter)

      case "top":    return xy(NaN, bbox.top)
      case "left":   return xy(bbox.left, NaN)
      case "right":  return xy(bbox.right, NaN)
      case "bottom": return xy(NaN, bbox.bottom)

      default: return xy(NaN, NaN)
    }
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
    coordinates: p.Property<CoordinateMapping | "screen" | null>
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
    this.define<Renderer.Props>(({Boolean, String, Ref, Nullable, Enum, Or}) => ({
      group:        [ Nullable(Ref(RendererGroup)), null ],
      level:        [ RenderLevel, "image" ],
      visible:      [ Boolean, true ],
      x_range_name: [ String, "default" ],
      y_range_name: [ String, "default" ],
      coordinates:  [ Nullable(Or(Ref(CoordinateMapping), Enum("screen"))), null ],
      propagate_hover: [ Boolean, false ],
    }))
  }
}
