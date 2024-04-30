import {GestureTool, GestureToolView} from "../gestures/gesture_tool"
import {OnOffButton} from "../on_off_button"
import type {PlotView} from "../../plots/plot"
import {BoxAnnotation} from "../../annotations/box_annotation"
import {Range} from "../../ranges/range"
import type {RangeState} from "../../plots/range_manager"
import type {PanEvent, TapEvent, MoveEvent, KeyEvent, EventType} from "core/ui_events"
import {logger} from "core/logging"
import type * as p from "core/properties"
import {assert, unreachable} from "core/util/assert"
import {isNumber, non_null} from "core/util/types"
import {tool_icon_range} from "styles/icons.css"
import {Node} from "../../coordinates/node"
import type {CoordinateMapper, LRTB} from "core/util/bbox"
import type {CoordinateUnits} from "core/enums"
import type {Scale} from "../../scales/scale"
import {Enum} from "core/kinds"

const SelectGesture = Enum("pan", "tap", "none")
type SelectGesture = typeof SelectGesture["__type__"]

export class RangeToolView extends GestureToolView {
  declare model: RangeTool
  declare readonly parent: PlotView

  override get overlays() {
    return [...super.overlays, this.model.overlay]
  }

  override initialize(): void {
    super.initialize()
    this.model.update_overlay_from_ranges()
  }

  override connect_signals(): void {
    super.connect_signals()

    const update_overlay = () => this.model.update_overlay_from_ranges()

    this.on_transitive_change(this.model.properties.x_range, update_overlay)
    this.on_transitive_change(this.model.properties.y_range, update_overlay)

    this.model.overlay.pan.connect(([state, _]) => {
      if (state == "pan") {
        this.model.update_ranges_from_overlay()
      } else if (state == "pan:end") {
        const ranges = [this.model.x_range, this.model.y_range].filter(non_null)
        this.parent.trigger_ranges_update_event(ranges)
      }
    })

    const {active, x_interaction, y_interaction} = this.model.properties
    this.on_change([active, x_interaction, y_interaction], () => {
      this.model.update_constraints()
    })
  }

  protected _mappers(): LRTB<CoordinateMapper> {
    const mapper = (units: CoordinateUnits, scale: Scale,
        view: CoordinateMapper, canvas: CoordinateMapper) => {
      switch (units) {
        case "canvas": return canvas
        case "screen": return view
        case "data":   return scale
      }
    }

    const {overlay} = this.model
    const {frame, canvas} = this.plot_view
    const {x_scale, y_scale} = frame
    const {x_view, y_view} = frame.bbox
    const {x_screen, y_screen} = canvas.bbox

    return {
      left: mapper(overlay.left_units, x_scale, x_view, x_screen),
      right: mapper(overlay.right_units, x_scale, x_view, x_screen),
      top: mapper(overlay.top_units, y_scale, y_view, y_screen),
      bottom: mapper(overlay.bottom_units, y_scale, y_view, y_screen),
    }
  }

  protected _invert_lrtb({left, right, top, bottom}: LRTB): LRTB<number | Node> {
    const lrtb = this._mappers()

    const {x_range, y_range} = this.model
    const has_x = x_range != null
    const has_y = y_range != null

    return {
      left: has_x ? lrtb.left.invert(left) : this.model.nodes.left,
      right: has_x ? lrtb.right.invert(right) : this.model.nodes.right,
      top: has_y ? lrtb.top.invert(top) : this.model.nodes.top,
      bottom: has_y ? lrtb.bottom.invert(bottom) : this.model.nodes.bottom,
    }
  }

  protected _compute_limits(curr_point: [number, number]): [[number, number], [number, number]] {
    const dims = (() => {
      const {x_range, y_range} = this.model
      const has_x = x_range != null
      const has_y = y_range != null

      if (has_x && has_y) {
        return "both"
      } else if (has_x) {
        return "width"
      } else if (has_y) {
        return "height"
      } else {
        unreachable()
      }
    })()

    assert(this._base_point != null)
    let base_point = this._base_point
    if (this.model.overlay.symmetric) {
      const [cx, cy] = base_point
      const [dx, dy] = curr_point
      base_point = [cx - (dx - cx), cy - (dy - cy)]
    }

    const {frame} = this.plot_view
    return this.model._get_dim_limits(base_point, curr_point, frame, dims)
  }

  protected _base_point: [number, number] | null

  override _tap(ev: TapEvent): void {
    assert(this.model.select_gesture == "tap")

    const {sx, sy} = ev
    const {frame} = this.plot_view
    if (!frame.bbox.contains(sx, sy)) {
      return
    }

    if (this._base_point == null) {
      this._base_point = [sx, sy]
    } else {
      this._update_overlay(sx, sy)
      this._base_point = null
    }
  }

  override _move(ev: MoveEvent): void {
    if (this._base_point != null && this.model.select_gesture == "tap") {
      const {sx, sy} = ev
      this._update_overlay(sx, sy)
    }
  }

  override _pan_start(ev: PanEvent): void {
    assert(this.model.select_gesture == "pan")
    assert(this._base_point == null)

    const {sx, sy} = ev
    const {frame} = this.plot_view
    if (!frame.bbox.contains(sx, sy)) {
      return
    }

    this._base_point = [sx, sy]
  }

  protected _update_overlay(sx: number, sy: number): void {
    const [sxlim, sylim] = this._compute_limits([sx, sy])
    const [[left, right], [top, bottom]] = [sxlim, sylim]
    this.model.overlay.update(this._invert_lrtb({left, right, top, bottom}))
    this.model.update_ranges_from_overlay()
  }

  override _pan(ev: PanEvent): void {
    if (this._base_point == null) {
      return
    }

    const {sx, sy} = ev
    this._update_overlay(sx, sy)
  }

  override _pan_end(ev: PanEvent): void {
    if (this._base_point == null) {
      return
    }

    const {sx, sy} = ev
    this._update_overlay(sx, sy)

    this._base_point = null
  }

  protected get _is_selecting(): boolean {
    return this._base_point != null
  }

  protected _stop(): void {
    this._base_point = null
  }

  override _keyup(ev: KeyEvent): void {
    if (!this.model.active) {
      return
    }

    if (ev.key == "Escape") {
      if (this._is_selecting) {
        this._stop()
        return
      }
    }
  }
}

const DEFAULT_RANGE_OVERLAY = () => {
  return new BoxAnnotation({
    syncable: false,
    level: "overlay",
    visible: true,
    editable: true,
    propagate_hover: true,
    left: NaN,
    right: NaN,
    top: NaN,
    bottom: NaN,
    left_limit: Node.frame.left,
    right_limit: Node.frame.right,
    top_limit: Node.frame.top,
    bottom_limit: Node.frame.bottom,
    fill_color: "lightgrey",
    fill_alpha: 0.5,
    line_color: "black",
    line_alpha: 1.0,
    line_width: 0.5,
    line_dash: [2, 2],
  })
}

export namespace RangeTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GestureTool.Props & {
    x_range: p.Property<Range | null>
    y_range: p.Property<Range | null>
    x_interaction: p.Property<boolean>
    y_interaction: p.Property<boolean>
    overlay: p.Property<BoxAnnotation>
    select_gesture: p.Property<SelectGesture>
  }
}

export interface RangeTool extends RangeTool.Attrs {}

export class RangeTool extends GestureTool {
  declare properties: RangeTool.Props
  declare __view_type__: RangeToolView

  constructor(attrs?: Partial<RangeTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = RangeToolView

    this.define<RangeTool.Props>(({Bool, Ref, Nullable}) => ({
      x_range:        [ Nullable(Ref(Range)), null ],
      y_range:        [ Nullable(Ref(Range)), null ],
      x_interaction:  [ Bool, true ],
      y_interaction:  [ Bool, true ],
      overlay:        [ Ref(BoxAnnotation), DEFAULT_RANGE_OVERLAY ],
      select_gesture: [ SelectGesture, "none" ],
    }))

    this.override<RangeTool.Props>({
      active: true,
    })
  }

  override initialize(): void {
    super.initialize()
    this.update_constraints()
  }

  update_constraints(): void {
    this.overlay.editable = this.active

    const has_x = this.x_range != null && this.x_interaction
    const has_y = this.y_range != null && this.y_interaction

    if (has_x && has_y) {
      this.overlay.movable = "both"
      this.overlay.resizable = "all"
    } else if (has_x) {
      this.overlay.movable = "x"
      this.overlay.resizable = "x"
    } else if (has_y) {
      this.overlay.movable = "y"
      this.overlay.resizable = "y"
    } else {
      this.overlay.movable = "none"
      this.overlay.resizable = "none"
    }

    const {x_range, y_range} = this
    if (x_range != null) {
      this.overlay.min_width = x_range.min_interval ?? 0
      this.overlay.max_width = x_range.max_interval ?? Infinity
    }
    if (y_range != null) {
      this.overlay.min_height = y_range.min_interval ?? 0
      this.overlay.max_height = y_range.max_interval ?? Infinity
    }
  }

  update_ranges_from_overlay(): void {
    const {left, right, top, bottom} = this.overlay
    const {x_range, y_range} = this

    const affected_plots = new Set<PlotView>()
    const xrs: RangeState = new Map()
    const yrs: RangeState = new Map()

    if (x_range != null && this.x_interaction) {
      assert(isNumber(left) && isNumber(right))
      xrs.set(x_range, {start: left, end: right})
      for (const plot of x_range.linked_plots) {
        affected_plots.add(plot)
      }
    }
    if (y_range != null && this.y_interaction) {
      assert(isNumber(bottom) && isNumber(top))
      yrs.set(y_range, {start: bottom, end: top})
      for (const plot of y_range.linked_plots) {
        affected_plots.add(plot)
      }
    }

    for (const plot of affected_plots) {
      plot.update_range({xrs, yrs}, {panning: true, scrolling: true})
    }
  }

  readonly nodes = Node.frame.freeze()

  update_overlay_from_ranges(): void {
    const {x_range, y_range} = this
    const has_x = x_range != null
    const has_y = y_range != null

    this.overlay.update({
      left: has_x ? x_range.start : this.nodes.left,
      right: has_x ? x_range.end : this.nodes.right,
      top: has_y ? y_range.end : this.nodes.top,
      bottom: has_y ? y_range.start : this.nodes.bottom,
    })

    if (!has_x && !has_y) {
      logger.warn("RangeTool not configured with any Ranges.")
      this.overlay.clear()
    }
  }

  override tool_name = "Range Tool"
  override tool_icon = tool_icon_range

  get event_type(): EventType | EventType[] {
    switch (this.select_gesture) {
      case "pan":  return "pan" as "pan"
      case "tap":  return ["tap" as "tap", "move" as "move"]
      case "none": return []
    }
  }

  readonly default_order = 40

  override supports_auto(): boolean {
    return true
  }

  override tool_button(): OnOffButton {
    return new OnOffButton({tool: this})
  }
}
