import {Model} from "../model"
import type {HasProps} from "./has_props"
import type {Attrs} from "./types"
import {isPlainObject} from "./util/types"
import {assert} from "./util/assert"
import type {GeometryData} from "./geometry"
import type {Class} from "./class"
import type {KeyModifiers} from "./ui_gestures"
import type {Serializable, Serializer} from "./serialization"
import {serialize} from "./serialization"
import {Deserializer} from "./serialization/deserializer"
import type {Equatable, Comparator} from "./util/eq"
import {equals} from "./util/eq"
import type {Legend} from "../models/annotations/legend"
import type {LegendItem} from "../models/annotations/legend_item"
import type {ClearInput} from "../models/widgets/input_widget"

Deserializer.register("event", (rep: BokehEventRep, deserializer: Deserializer): BokehEvent => {
  const cls = deserializable_events.get(rep.name)
  if (cls !== undefined && cls.from_values != null) {
    const values = deserializer.decode(rep.values)
    assert(isPlainObject(values))
    return cls.from_values(values)
  } else {
    deserializer.error(`deserialization of '${rep.name}' event is not supported`)
  }
})

export type BokehEventType =
  DocumentEventType |
  ModelEventType

export type DocumentEventType =
  "document_ready" |
  ConnectionEventType

export type ConnectionEventType =
  "connection_lost"

export type ModelEventType =
  "button_click" |
  "legend_item_click" |
  "menu_item_click" |
  "value_submit" |
  UIEventType

export type UIEventType =
  "lodstart" |
  "lodend" |
  "rangesupdate" |
  "selectiongeometry" |
  "reset" |
  PointEventType

export type PointEventType =
  "pan" |
  "pinch" |
  "rotate" |
  "wheel" |
  "mousemove" |
  "mouseenter" |
  "mouseleave" |
  "tap" |
  "doubletap" |
  "press" |
  "pressup" |
  "panstart" |
  "panend" |
  "pinchstart" |
  "pinchend" |
  "rotatestart" |
  "rotateend"

/**
 * Events known to bokeh by name, for type-safety of Model.on_event(event_name, (EventType) => void).
 * Other events, including user defined events, can be referred to by event's class object.
 */
export type BokehEventMap = {
  document_ready: DocumentReady
  clear_input: ClearInput
  connection_lost: ConnectionLost
  button_click: ButtonClick
  legend_item_click: LegendItemClick
  menu_item_click: MenuItemClick
  value_submit: ValueSubmit
  lodstart: LODStart
  lodend: LODEnd
  rangesupdate: RangesUpdate
  selectiongeometry: SelectionGeometry
  reset: Reset
  pan: Pan
  pinch: Pinch
  rotate: Rotate
  wheel: MouseWheel
  mousemove: MouseMove
  mouseenter: MouseEnter
  mouseleave: MouseLeave
  tap: Tap
  doubletap: DoubleTap
  press: Press
  pressup: PressUp
  panstart: PanStart
  panend: PanEnd
  pinchstart: PinchStart
  pinchend: PinchEnd
  rotatestart: RotateStart
  rotateend: RotateEnd
}

export type BokehEventRep = {
  type: "event"
  name: string
  values: unknown
}

function event(event_name: string) {
  return (cls: Class<BokehEvent>) => {
    cls.prototype.event_name = event_name
  }
}

const deserializable_events: Map<string, typeof BokehEvent> = new Map()

/**
 * Marks and registers a class as a one way (server -> client) event.
 */
export function server_event(event_name: string) {
  return (cls: Class<BokehEvent>) => {
    if (deserializable_events.has(event_name)) {
      throw new Error(`'${event_name}' event is already registered`)
    }
    deserializable_events.set(event_name, cls)
    cls.prototype.event_name = event_name
    cls.prototype.publish = false
  }
}

export abstract class BokehEvent implements Serializable, Equatable {
  declare event_name: string
  declare publish: boolean

  [serialize](serializer: Serializer): BokehEventRep {
    const {event_name: name, event_values} = this
    const values = serializer.encode(event_values)
    return {type: "event", name, values}
  }

  [equals](that: this, cmp: Comparator): boolean {
    return this.event_name == that.event_name && cmp.eq(this.event_values, that.event_values)
  }

  protected abstract get event_values(): Attrs

  static from_values?(values: Attrs): BokehEvent

  static {
    this.prototype.publish = true
  }
}

export abstract class ModelEvent extends BokehEvent {
  origin: HasProps | null = null

  protected get event_values(): Attrs {
    return {model: this.origin}
  }
}

export abstract class UserEvent extends ModelEvent {
  constructor(readonly values: Attrs) {
    super()
  }

  protected override get event_values(): Attrs {
    return {...super.event_values, ...this.values}
  }

  static override from_values(values: Attrs): UserEvent {
    const origin = (() => {
      if ("model" in values) {
        const {model} = values
        assert(model === null || model instanceof Model)
        delete values.model
        return model
      } else {
        return null
      }
    })()
    const event = new (this as any)(values)
    event.origin = origin
    return event
  }
}

export abstract class DocumentEvent extends BokehEvent {}

@event("document_ready")
export class DocumentReady extends DocumentEvent {
  protected get event_values(): Attrs {
    return {}
  }
}

export abstract class ConnectionEvent extends DocumentEvent {}

export class ConnectionLost extends ConnectionEvent {
  readonly timestamp = new Date()

  protected get event_values(): Attrs {
    const {timestamp} = this
    return {timestamp}
  }

  static {
    this.prototype.event_name = "connection_lost"
    this.prototype.publish = false
  }
}

@event("button_click")
export class ButtonClick extends ModelEvent {}

@event("legend_item_click")
export class LegendItemClick extends ModelEvent {

  constructor(readonly model: Legend, readonly item: LegendItem) {
    super()
  }

  protected override get event_values(): Attrs {
    const {item} = this
    return {...super.event_values, item}
  }
}

@event("menu_item_click")
export class MenuItemClick extends ModelEvent {

  constructor(readonly item: string) {
    super()
  }

  protected override get event_values(): Attrs {
    const {item} = this
    return {...super.event_values, item}
  }
}

@event("value_submit")
export class ValueSubmit extends ModelEvent {

  constructor(readonly value: string) {
    super()
  }

  protected override get event_values(): Attrs {
    const {value} = this
    return {...super.event_values, value}
  }
}

// A UIEvent is an event originating on a canvas this includes.
// DOM events such as keystrokes as well as hammer, LOD, and range events.
export abstract class UIEvent extends ModelEvent {}

@event("lodstart")
export class LODStart extends UIEvent {}

@event("lodend")
export class LODEnd extends UIEvent {}

@event("rangesupdate")
export class RangesUpdate extends UIEvent {

  constructor(readonly x0: number, readonly x1: number, readonly y0: number, readonly y1: number) {
    super()
  }

  protected override get event_values(): Attrs {
    const {x0, x1, y0, y1} = this
    return {...super.event_values, x0, x1, y0, y1}
  }
}

@event("selectiongeometry")
export class SelectionGeometry extends UIEvent {

  constructor(readonly geometry: GeometryData, readonly final: boolean) {
    super()
  }

  protected override get event_values(): Attrs {
    const {geometry, final} = this
    return {...super.event_values, geometry, final}
  }
}

@event("reset")
export class Reset extends UIEvent {}

export abstract class PointEvent extends UIEvent {

  constructor(
    readonly sx: number, readonly sy: number,
    readonly x: number, readonly y: number,
    readonly modifiers: KeyModifiers,
  ) {
    super()
  }

  protected override get event_values(): Attrs {
    const {sx, sy, x, y, modifiers} = this
    return {...super.event_values, sx, sy, x, y, modifiers}
  }
}

@event("pan")
export class Pan extends PointEvent {

  /* TODO: direction: -1 | 1 */
  constructor(
    sx: number, sy: number,
    x: number, y: number,
    readonly delta_x: number, readonly delta_y: number,
    modifiers: KeyModifiers,
  ) {
    super(sx, sy, x, y, modifiers)
  }

  protected override get event_values(): Attrs {
    const {delta_x, delta_y/*, direction*/} = this
    return {...super.event_values, delta_x, delta_y/*, direction*/}
  }
}

@event("pinch")
export class Pinch extends PointEvent {

  constructor(
    sx: number, sy: number,
    x: number, y: number,
    readonly scale: number,
    modifiers: KeyModifiers,
  ) {
    super(sx, sy, x, y, modifiers)
  }

  protected override get event_values(): Attrs {
    const {scale} = this
    return {...super.event_values, scale}
  }
}

@event("rotate")
export class Rotate extends PointEvent {

  constructor(
    sx: number, sy: number,
    x: number, y: number,
    readonly rotation: number,
    modifiers: KeyModifiers,
  ) {
    super(sx, sy, x, y, modifiers)
  }

  protected override get event_values(): Attrs {
    const {rotation} = this
    return {...super.event_values, rotation}
  }
}

@event("wheel")
export class MouseWheel extends PointEvent {

  constructor(
    sx: number, sy: number,
    x: number, y: number,
    readonly delta: number,
    modifiers: KeyModifiers,
  ) {
    super(sx, sy, x, y, modifiers)
  }

  protected override get event_values(): Attrs {
    const {delta} = this
    return {...super.event_values, delta}
  }
}

@event("mousemove")
export class MouseMove extends PointEvent {}

@event("mouseenter")
export class MouseEnter extends PointEvent {}

@event("mouseleave")
export class MouseLeave extends PointEvent {}

@event("tap")
export class Tap extends PointEvent {}

@event("doubletap")
export class DoubleTap extends PointEvent {}

@event("press")
export class Press extends PointEvent {}

@event("pressup")
export class PressUp extends PointEvent {}

@event("panstart")
export class PanStart extends PointEvent {}

@event("panend")
export class PanEnd extends PointEvent {}

@event("pinchstart")
export class PinchStart extends PointEvent {}

@event("pinchend")
export class PinchEnd extends PointEvent {}

@event("rotatestart")
export class RotateStart extends PointEvent {}

@event("rotateend")
export class RotateEnd extends PointEvent {}
