import type * as p from "core/properties"
import {View} from "core/view"
import type {Class} from "core/class"
import type {Dimensions} from "core/enums"
import {ToolIcon} from "core/enums"
import {min, max} from "core/util/array"
import type {MenuItem} from "core/util/menus"
import {isString} from "core/util/types"
import {Model} from "../../model"
import type {Renderer} from "../renderers/renderer"
import type {CartesianFrameView} from "../canvas/cartesian_frame"
import type {EventType, PanEvent, PinchEvent, RotateEvent, ScrollEvent, TapEvent, MoveEvent, KeyEvent} from "core/ui_events"
import type {ToolButton} from "./tool_button"

import type {PanTool} from "./gestures/pan_tool"
import type {WheelPanTool} from "./gestures/wheel_pan_tool"
import type {WheelZoomTool} from "./gestures/wheel_zoom_tool"
import type {ZoomInTool} from "./actions/zoom_in_tool"
import type {ZoomOutTool} from "./actions/zoom_out_tool"
import type {TapTool} from "./gestures/tap_tool"
import type {CrosshairTool} from "./inspectors/crosshair_tool"
import type {BoxSelectTool} from "./gestures/box_select_tool"
import type {PolySelectTool} from "./gestures/poly_select_tool"
import type {LassoSelectTool} from "./gestures/lasso_select_tool"
import type {BoxZoomTool} from "./gestures/box_zoom_tool"
import type {HoverTool} from "./inspectors/hover_tool"
import type {SaveTool} from "./actions/save_tool"
import type {UndoTool} from "./actions/undo_tool"
import type {RedoTool} from "./actions/redo_tool"
import type {ResetTool} from "./actions/reset_tool"
import type {HelpTool} from "./actions/help_tool"

import type {ToolButtonView} from "./tool_button"

export type ToolAliases = {
  pan:          PanTool
  xpan:         PanTool
  ypan:         PanTool
  xwheel_pan:   WheelPanTool
  ywheel_pan:   WheelPanTool
  wheel_zoom:   WheelZoomTool
  xwheel_zoom:  WheelZoomTool
  ywheel_zoom:  WheelZoomTool
  zoom_in:      ZoomInTool
  xzoom_in:     ZoomInTool
  yzoom_in:     ZoomInTool
  zoom_out:     ZoomOutTool
  xzoom_out:    ZoomOutTool
  yzoom_out:    ZoomOutTool
  click:        TapTool
  tap:          TapTool
  crosshair:    CrosshairTool
  xcrosshair:   CrosshairTool
  ycrosshair:   CrosshairTool
  box_select:   BoxSelectTool
  xbox_select:  BoxSelectTool
  ybox_select:  BoxSelectTool
  poly_select:  PolySelectTool
  lasso_select: LassoSelectTool
  box_zoom:     BoxZoomTool
  xbox_zoom:    BoxZoomTool
  ybox_zoom:    BoxZoomTool
  hover:        HoverTool
  save:         SaveTool
  undo:         UndoTool
  redo:         RedoTool
  reset:        ResetTool
  help:         HelpTool
}

export type EventRole = EventType | "multi"

export abstract class ToolView extends View {
  declare model: Tool

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.active.change, () => {
      if (this.model.active) {
        this.activate()
      } else {
        this.deactivate()
      }
    })
  }

  get overlays(): Renderer[] {
    return []
  }

  // activate is triggered by toolbar ui actions
  activate(): void {}

  // deactivate is triggered by toolbar ui actions
  deactivate(): void {}

  _pan_start?(e: PanEvent): void | boolean
  _pan?(e: PanEvent): void | boolean
  _pan_end?(e: PanEvent): void | boolean

  _pinch_start?(e: PinchEvent): void | boolean
  _pinch?(e: PinchEvent): void | boolean
  _pinch_end?(e: PinchEvent): void | boolean

  _rotate_start?(e: RotateEvent): void | boolean
  _rotate?(e: RotateEvent): void | boolean
  _rotate_end?(e: RotateEvent): void | boolean

  _tap?(e: TapEvent): void | boolean
  _doubletap?(e: TapEvent): void | boolean
  _press?(e: TapEvent): void | boolean
  _pressup?(e: TapEvent): void | boolean

  _move_enter?(e: MoveEvent): void | boolean
  _move?(e: MoveEvent): void | boolean
  _move_exit?(e: MoveEvent): void | boolean

  _scroll?(e: ScrollEvent): void | boolean

  _keydown?(e: KeyEvent): void | boolean
  _keyup?(e: KeyEvent): void | boolean
}

export namespace Tool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    icon: p.Property<ToolIcon | string | null>
    description: p.Property<string | null>
    visible: p.Property<boolean>
    active: p.Property<boolean>
    disabled: p.Property<boolean>
  }
}

export interface Tool extends Tool.Attrs {}

export abstract class Tool extends Model {
  declare properties: Tool.Props
  declare __view_type__: ToolView

  constructor(attrs?: Partial<Tool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype._known_aliases = new Map()

    this.define<Tool.Props>(({Bool, Str, Regex, Nullable, Or}) => ({
      icon: [ Nullable(Or(ToolIcon, Regex(/^--/), Regex(/^\./), Regex(/^data:image/))), null ],
      description: [ Nullable(Str), null ],
      visible: [ Bool, true ],
    }))

    this.internal<Tool.Props>(({Bool}) => ({
      active: [ Bool, false ],
      disabled: [ Bool, false ],
    }))
  }

  readonly tool_name: string
  readonly tool_icon?: string

  // GestureTool {{{
  readonly event_type?: EventType | EventType[]

  get event_role(): EventRole {
    const {event_type} = this
    return isString(event_type) ? event_type : "multi"
  }

  get event_types(): EventType[] {
    const {event_type} = this
    return event_type == null ? [] : (isString(event_type) ? [event_type] : event_type)
  }
  // }}}

  button_view: Class<ToolButtonView>

  abstract tool_button(): ToolButton

  get tooltip(): string {
    return this.description ?? this.tool_name
  }

  get computed_icon(): string | undefined {
    const {icon, tool_icon} = this
    return icon ?? (tool_icon != null ? `.${tool_icon}` : undefined)
  }

  get menu(): MenuItem[] | null {
    return null
  }

  supports_auto(): boolean {
    return false
  }

  // utility function to get limits along both dimensions, given
  // optional dimensional constraints
  _get_dim_limits([sx0, sy0]: [number, number], [sx1, sy1]: [number, number],
      frame: CartesianFrameView, dims: Dimensions): [[number, number], [number, number]] {

    const hr = frame.bbox.h_range
    let sxlim: [number, number]
    if (dims == "width" || dims == "both") {
      sxlim = [min([sx0, sx1]),           max([sx0, sx1])]
      sxlim = [max([sxlim[0], hr.start]), min([sxlim[1], hr.end])]
    } else {
      sxlim = [hr.start, hr.end]
    }

    const vr = frame.bbox.v_range
    let sylim: [number, number]
    if (dims == "height" || dims == "both") {
      sylim = [min([sy0, sy1]),           max([sy0, sy1])]
      sylim = [max([sylim[0], vr.start]), min([sylim[1], vr.end])]
    } else {
      sylim = [vr.start, vr.end]
    }

    return [sxlim, sylim]
  }

  // utility function to return a tool name, modified
  // by the active dimensions. Used by tools that have dimensions
  protected _get_dim_tooltip(dims: Dimensions | "auto"): string {
    const {description, tool_name} = this
    if (description != null) {
      return description
    } else if (dims == "both") {
      return tool_name
    } else if (dims == "auto") {
      return `${tool_name} (either x, y or both dimensions)`
    } else {
      return `${tool_name} (${dims == "width" ? "x" : "y"}-axis)`
    }
  }

  /** @prototype */
  private _known_aliases: Map<string, () => Tool>

  static register_alias(name: string, fn: () => Tool): void {
    this.prototype._known_aliases.set(name, fn)
  }

  static from_string<K extends keyof ToolAliases>(name: K): ToolAliases[K]
  static from_string(name: string): Tool

  static from_string(name: string): Tool {
    const fn = this.prototype._known_aliases.get(name)
    if (fn != null) {
      return fn()
    } else {
      const names = [...this.prototype._known_aliases.keys()]
      throw new Error(`unexpected tool name '${name}', possible tools are ${names.join(", ")}`)
    }
  }
}
