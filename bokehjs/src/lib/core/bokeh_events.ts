import {HasProps} from "./has_props"
import {GeometryData} from "./geometry"
import {Class} from "./class"

export type JSON = {[key: string]: unknown}

export type EventJSON = {event_name: string, event_values: JSON}

function event(event_name: string) {
  return function(cls: Class<BokehEvent>) {
    cls.prototype.event_name = event_name
  }
}

export abstract class BokehEvent {
  /* prototype */ event_name: string

  to_json(): EventJSON {
    const {event_name} = this
    return {event_name, event_values: this._to_json()}
  }

  protected abstract _to_json(): JSON
}

export abstract class ModelEvent extends BokehEvent {

  origin: HasProps | null = null

  protected _to_json(): JSON {
    return {model: this.origin}
  }
}

@event("document_ready")
export class DocumentReady extends BokehEvent {
  protected _to_json(): JSON {
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

  protected _to_json(): JSON {
    const {item} = this
    return {...super._to_json(), item}
  }
}

// A UIEvent is an event originating on a canvas this includes.
// DOM events such as keystrokes as well as hammer events and LOD events.
export abstract class UIEvent extends ModelEvent {}

@event("lodstart")
export class LODStart extends UIEvent {}

@event("lodend")
export class LODEnd extends UIEvent {}

@event("selectiongeometry")
export class SelectionGeometry extends UIEvent {

  constructor(readonly geometry: GeometryData, readonly final: boolean) {
    super()
  }

  protected _to_json(): JSON {
    const {geometry, final} = this
    return {...super._to_json(), geometry, final}
  }
}

@event("reset")
export class Reset extends UIEvent {}

export abstract class PointEvent extends UIEvent {

  constructor(readonly sx: number, readonly sy: number,
              readonly x: number, readonly y: number) {
    super()
  }

  protected _to_json(): JSON {
    const {sx, sy, x, y} = this
    return {...super._to_json(), sx, sy, x, y}
  }
}

@event("pan")
export class Pan extends PointEvent {

  /* TODO: direction: -1 | 1 */
  constructor(readonly sx: number, readonly sy: number,
              readonly x: number, readonly y: number,
              readonly delta_x: number, readonly delta_y: number) {
    super(sx, sy, x, y)
  }

  protected _to_json(): JSON {
    const {delta_x, delta_y/*, direction*/} = this
    return {...super._to_json(), delta_x, delta_y/*, direction*/}
  }
}

@event("pinch")
export class Pinch extends PointEvent {

  constructor(readonly sx: number, readonly sy: number,
              readonly x: number, readonly y: number,
              readonly scale: number) {
    super(sx, sy, x, y)
  }

  protected _to_json(): JSON {
    const {scale} = this
    return {...super._to_json(), scale}
  }
}

@event("rotate")
export class Rotate extends PointEvent {

  constructor(readonly sx: number, readonly sy: number,
              readonly x: number, readonly y: number,
              readonly rotation: number) {
    super(sx, sy, x, y)
  }

  protected _to_json(): JSON {
    const {rotation} = this
    return {...super._to_json(), rotation}
  }
}

@event("wheel")
export class MouseWheel extends PointEvent {

  constructor(readonly sx: number, readonly sy: number,
              readonly x: number, readonly y: number,
              readonly delta: number) {
    super(sx, sy, x, y)
  }

  protected _to_json(): JSON {
    const {delta} = this
    return {...super._to_json(), delta}
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
