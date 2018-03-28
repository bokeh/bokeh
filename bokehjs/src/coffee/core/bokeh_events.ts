import {logger} from "./logging"
import {clone} from "./util/object"

const event_classes: {[key: string]: typeof BokehEvent} = {}

export function register_event_class(event_name: string) {
  return function(event_cls: typeof BokehEvent) {
    event_cls.prototype.event_name = event_name
    event_classes[event_name] = event_cls
  }
}

export function register_with_event(event_cls: typeof BokehEvent, ...models: any[]) {
  const applicable_models = event_cls.prototype.applicable_models.concat(models)
  event_cls.prototype.applicable_models = applicable_models
}

export abstract class BokehEvent {

  /* prototype */ event_name: string
  /* prototype */ applicable_models: any[]

  protected _options: any
  model_id: string | null = null

  constructor(options: any = {}) {
    this._options = options
    if (options.model_id) {
      this.model_id = options.model_id
    }
  }

  set_model_id(id: string): this {
    this._options.model_id = id
    this.model_id = id
    return this
  }

  is_applicable_to(obj: any): boolean {
    return this.applicable_models.some((model) => obj instanceof model)
  }

  static event_class(e: any): any {
    // Given an event with a type attribute matching the event_name,
    // return the appropriate BokehEvent class
    if (e.type) {
      return event_classes[e.type]
    } else {
      logger.warn('BokehEvent.event_class required events with a string type attribute')
    }
  }

  toJSON(): object {
    return {
      event_name: this.event_name,
      event_values: clone(this._options),
    }
  }

  _customize_event(_model: any): this {
    return this
  }
}

BokehEvent.prototype.applicable_models = []

@register_event_class("button_click")
export class ButtonClick extends BokehEvent {}

// A UIEvent is an event originating on a PlotCanvas this includes
// DOM events such as keystrokes as well as hammer events and LOD events.
export abstract class UIEvent extends BokehEvent {}

@register_event_class("lodstart")
export class LODStart extends UIEvent {}

@register_event_class("lodend")
export class LODEnd extends UIEvent {}

@register_event_class("selectiongeometry")
export class SelectionGeometry extends UIEvent {
  geometry: any
  final: boolean

  constructor(options: any) {
    super(options)
    this.geometry = options.geometry
    this.final = options.final
  }
}

@register_event_class("reset")
export class Reset extends UIEvent {}

export /* TODO abstract */ class PointEvent extends UIEvent {

  sx: number
  sy: number

  x: number | null
  y: number | null

  constructor(options: any) {
    super(options)
    this.sx = options.sx
    this.sy = options.sy
    this.x = null
    this.y = null
  }

  static from_event(e: any, model_id: string | null = null): PointEvent {
    return new this({ sx: e.sx, sy: e.sy, model_id: model_id })
  }

  _customize_event(plot: any): this {
    const xscale = plot.plot_canvas.frame.xscales['default']
    const yscale = plot.plot_canvas.frame.yscales['default']
    this.x = xscale.invert(this.sx)
    this.y = yscale.invert(this.sy)
    this._options['x'] = this.x
    this._options['y'] = this.y
    return this
  }
}

@register_event_class("pan")
export class Pan extends PointEvent {

  static from_event(e: any, model_id: string | null = null): Pan {
    return new this({
      sx: e.sx,
      sy: e.sy,
      delta_x: e.deltaX,
      delta_y: e.deltaY,
      direction: e.direction,
      model_id: model_id,
    })
  }

  delta_x: number
  delta_y: number

  constructor(options: any = {}) {
    super(options)
    this.delta_x = options.delta_x
    this.delta_y = options.delta_y
  }
}

@register_event_class("pinch")
export class Pinch extends PointEvent {

  static from_event(e: any, model_id: string | null = null): Pinch {
    return new this({
      sx: e.sx,
      sy: e.sy,
      scale: e.scale,
      model_id: model_id,
    })
  }

  scale: number

  constructor(options: any = {}) {
    super(options)
    this.scale = options.scale
  }
}

@register_event_class("wheel")
export class MouseWheel extends PointEvent {

  static from_event(e: any, model_id: string | null = null): MouseWheel {
    return new this({
      sx: e.sx,
      sy: e.sy,
      delta: e.delta,
      model_id: model_id,
    })
  }

  delta: number

  constructor(options: any = {}) {
    super(options)
    this.delta = options.delta
  }
}

@register_event_class("mousemove")
export class MouseMove extends PointEvent {}

@register_event_class("mouseenter")
export class MouseEnter extends PointEvent {}

@register_event_class("mouseleave")
export class MouseLeave extends PointEvent {}

@register_event_class("tap")
export class Tap extends PointEvent {}

@register_event_class("doubletap")
export class DoubleTap extends PointEvent {}

@register_event_class("press")
export class Press extends PointEvent {}

@register_event_class("panstart")
export class PanStart extends PointEvent {}

@register_event_class("panend")
export class PanEnd extends PointEvent {}

@register_event_class("pinchstart")
export class PinchStart extends PointEvent {}

@register_event_class("pinchend")
export class PinchEnd extends PointEvent {}
