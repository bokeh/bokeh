import type {ViewOf, View} from "core/view"
import {StyledElement, StyledElementView} from "../ui/styled_element"
import {build_view} from "core/build_views"
import * as visuals from "core/visuals"
import {RenderLevel} from "core/enums"
import type * as p from "core/properties"
import {isNumber} from "core/util/types"
import type {CanvasLayer, Context2d} from "core/util/canvas"
import {assert} from "core/util/assert"
import type {Plot, PlotView} from "../plots/plot"
import type {CanvasView} from "../canvas/canvas"
import {CoordinateTransform, CoordinateMapping} from "../coordinates/coordinate_mapping"
import type {Node} from "../coordinates/node"
import type {XY} from "core/util/bbox"
import {Menu} from "../ui/menus/menu"
import type {HTML} from "../dom/html"
import {RendererGroup} from "./renderer_group"
import {InlineStyleSheet} from "core/dom"
import type {SidePanel} from "core/layout/side_panel"
import type {Layoutable} from "core/layout"

export abstract class RendererView extends StyledElementView implements visuals.Paintable {
  declare model: Renderer
  visuals: Renderer.Visuals

  declare readonly parent: PlotView

  layout?: Layoutable

  protected _panel: SidePanel | null = null
  get panel(): SidePanel | null {
    return this._panel
  }
  set panel(panel: SidePanel) {
    this._panel = panel
  }

  readonly position = new InlineStyleSheet()

  override computed_stylesheets(): InlineStyleSheet[] {
    return [...super.computed_stylesheets(), this.position]
  }

  override rendering_target(): HTMLElement | ShadowRoot {
    return this.plot_view.canvas_view.underlays_el
  }

  protected _context_menu: ViewOf<Menu> | null = null
  get context_menu(): ViewOf<Menu> | null {
    return this._context_menu
  }

  protected _coordinates?: CoordinateTransform
  get coordinates(): CoordinateTransform {
    const {_coordinates} = this
    if (_coordinates != null) {
      return _coordinates
    } else {
      return this._coordinates = this._initialize_coordinates()
    }
  }

  private _custom_coordinates: CoordinateTransform | null = null
  set coordinates(custom_coordinates: CoordinateTransform | null) {
    this._custom_coordinates = custom_coordinates
  }

  override initialize(): void {
    super.initialize()
    this.visuals = new visuals.Visuals(this)
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    const {context_menu} = this.model
    if (context_menu != null) {
      this._context_menu = await build_view(context_menu, {parent: this.plot_view})
    }
  }

  override remove(): void {
    this._context_menu?.remove()
    super.remove()
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
    this.connect(this.plot_view.frame.model.change, () => delete this._coordinates)
  }

  protected _initialize_coordinates(): CoordinateTransform {
    if (this._custom_coordinates != null) {
      return this._custom_coordinates
    }
    const {coordinates} = this.model
    const {frame} = this.plot_view
    if (coordinates != null) {
      return coordinates.get_transform(frame)
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

  get is_renderable(): boolean {
    return true
  }

  get is_dual_renderer(): boolean {
    return false
  }

  paint(ctx: Context2d): void {
    // It would be better to update geometry (the internal layout) only when
    // necessary, but conditions for that are not clear, so for now update
    // at every paint.
    this.update_geometry()
    this.compute_geometry()
    this.update_position()

    if (this.displayed && this.is_renderable) {
      this._paint(ctx)
    }

    this.mark_finished()
  }

  protected abstract _paint(ctx: Context2d): void

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
   * Updates the position of the associated DOM element.
   */
  update_position(): void {
    const {bbox, position} = this
    if (bbox != null && bbox.is_valid) {
      if (this.panel != null) {
        position.replace(`
        :host {
          position: relative;
          width:    ${bbox.width}px;
          height:   ${bbox.height}px;
        }
        `)
      } else {
        position.replace(`
        :host {
          position: absolute;
          left:     ${bbox.left}px;
          top:      ${bbox.top}px;
          width:    ${bbox.width}px;
          height:   ${bbox.height}px;
        }
        `)
      }
    } else {
      position.replace(`
      :host {
        display: none;
      }
      `)
    }
  }

  override resolve_frame(): View | null {
    return this.plot_view.frame as any // TODO CartesianFrameView (PR #13286)
  }

  override resolve_canvas(): View | null {
    return this.plot_view.canvas
  }

  override resolve_plot(): View | null {
    return this.plot_view
  }

  override resolve_symbol(node: Node): XY | number {
    const target = this
    const {bbox} = target
    if (bbox == null) {
      return {x: NaN, y: NaN}
    } else {
      const value = bbox.resolve(node.symbol)
      const {offset} = node
      if (isNumber(value)) {
        return value + offset
      } else {
        const {x, y} = value
        return {x: x + offset, y: y + offset}
      }
    }
  }

  get attribution(): HTML | string | null {
    return null
  }
}

export namespace Renderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = StyledElement.Props & {
    group: p.Property<RendererGroup | null>
    level: p.Property<RenderLevel>
    visible: p.Property<boolean>
    x_range_name: p.Property<string>
    y_range_name: p.Property<string>
    coordinates: p.Property<CoordinateMapping | null>
    propagate_hover: p.Property<boolean>
    context_menu: p.Property<Menu | null>
  }

  export type Visuals = visuals.Visuals
}

export interface Renderer extends Renderer.Attrs {}

export abstract class Renderer extends StyledElement {
  declare properties: Renderer.Props
  declare __view_type__: RendererView

  constructor(attrs?: Partial<Renderer.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Renderer.Props>(({Bool, Str, Ref, Nullable}) => ({
      group:        [ Nullable(Ref(RendererGroup)), null ],
      level:        [ RenderLevel, "image" ],
      visible:      [ Bool, true ],
      x_range_name: [ Str, "default" ],
      y_range_name: [ Str, "default" ],
      coordinates:  [ Nullable(Ref(CoordinateMapping)), null ],
      propagate_hover: [ Bool, false ],
      context_menu: [ Nullable(Ref(Menu)), null ],
    }))
  }
}
