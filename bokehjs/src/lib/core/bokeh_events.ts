import {HasProps} from "./has_props"
import {Attrs} from "./types"
import {GeometryData} from "./geometry"
import {Class} from "./class"
import {serialize, Serializable, Serializer} from "./serializer"
import {equals, Equatable, Comparator} from "./util/eq"

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

export abstract class BokehEvent implements Serializable, Equatable {
  /* prototype */ event_name: string

  [serialize](serializer: Serializer): BokehEventRep {
    const {event_name: name, event_values} = this
    const values = serializer.to_serializable(event_values)
    return {type: "event", name, values}
  }

  [equals](that: this, cmp: Comparator): boolean {
    return this.event_name == that.event_name && cmp.eq(this.event_values, that.event_values)
  }

  protected abstract get event_values(): Attrs
}

export abstract class ModelEvent extends BokehEvent {
  origin: HasProps | null = null

  protected get event_values(): Attrs {
    return {model: this.origin}
  }
}

@event("document_ready")
export class DocumentReady extends BokehEvent {
  protected get event_values(): Attrs {
    return {}
  }
}

@event("button_click")
export class ButtonClick extends ModelEvent {}

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

  constructor(readonly sx: number, readonly sy: number,
              readonly x: number, readonly y: number) {
    super()
  }

  protected override get event_values(): Attrs {
    const {sx, sy, x, y} = this
    return {...super.event_values, sx, sy, x, y}
  }
}

@event("pan")
export class Pan extends PointEvent {

  /* TODO: direction: -1 | 1 */
  constructor(sx: number, sy: number,
              x: number, y: number,
              readonly delta_x: number, readonly delta_y: number) {
    super(sx, sy, x, y)
  }

  protected override get event_values(): Attrs {
    const {delta_x, delta_y/*, direction*/} = this
    return {...super.event_values, delta_x, delta_y/*, direction*/}
  }
}

@event("pinch")
export class Pinch extends PointEvent {

  constructor(sx: number, sy: number,
              x: number, y: number,
              readonly scale: number) {
    super(sx, sy, x, y)
  }

  protected override get event_values(): Attrs {
    const {scale} = this
    return {...super.event_values, scale}
  }
}

@event("rotate")
export class Rotate extends PointEvent {

  constructor(sx: number, sy: number,
              x: number, y: number,
              readonly rotation: number) {
    super(sx, sy, x, y)
  }

  protected override get event_values(): Attrs {
    const {rotation} = this
    return {...super.event_values, rotation}
  }
}

@event("wheel")
export class MouseWheel extends PointEvent {

  constructor(sx: number, sy: number,
              x: number, y: number,
              readonly delta: number) {
    super(sx, sy, x, y)
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
