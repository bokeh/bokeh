import { logger } from "./logging"
import {Button} from "../models/widgets"
import {Plot} from "../models/plots/plot"

export class BokehEvent {
  static _event_classes: any = {}

  _options: any
  model_id: string

  constructor(options: any = {}) {
    this._options = options;
    if (options.model_id) {
      this.model_id = options.model_id
    }
  }

  set_model_id(id: string): this {
    this._options.model_id = id;
    this.model_id = id;
    return this
  }

  static event_class(e: any): any {
    // Given an event with a type attribute matching the event_name,
    // return the appropriate BokehEvent class
    if (e.type) {
      return this._event_classes[e.type];
    }
    else {
      logger.warn('BokehEvent.event_class required events with a string type attribute')
    }
  }

  toJSON(): any {
    const event_name: string = (this.constructor as any).event_name
    if (event_name != null) {
      return {
        event_name: event_name,
        event_values: this._options,
      };
    }
    else {
      throw Error('All events need to have an event name.')
    }
  }

  _customize_event(model: any): this {
    return this
  }

  static register_event_class(event_cls: any) {
    BokehEvent._event_classes[event_cls.event_name] = event_cls
  }
}

export class ButtonClick extends BokehEvent {
  static event_name = 'button_click'
  static applicable_models = [Button]
}


export class UIEvent extends BokehEvent {
  // A UIEvent is an event originating on a PlotCanvas this includes
  // DOM events such as keystrokes as well as hammer events and LOD events.
  static applicable_models = [Plot]
}


export class LODStart extends UIEvent {
  static event_name = 'lodstart'
}

export class LODEnd extends UIEvent {
  static event_name = 'lodend'
}


export class PointEvent extends UIEvent {

  sx: number
  sy: number

  x: number
  y: number

  constructor(options: any) {
    super(options)
    this.sx = options.sx;
    this.sy = options.sy;
    this.x = null;
    this.y = null;
  }

  static from_event(e: any, model_id: string = null) {
    return new this({ sx: e.bokeh['sx'], sy: e.bokeh['sy'], model_id: model_id });
  }

  _customize_event(plot: any) {
    let xmapper = plot.plot_canvas.frame.x_mappers['default'];
    let ymapper = plot.plot_canvas.frame.y_mappers['default'];
    this.x = xmapper.map_from_target(plot.plot_canvas.canvas.sx_to_vx(this.sx));
    this.y = ymapper.map_from_target(plot.plot_canvas.canvas.sy_to_vy(this.sy));
    this._options['x'] = this.x;
    this._options['y'] = this.y;
    return this
    }
}

export class Pan extends PointEvent {

  static event_name = 'pan'

  static from_event(e: any, model_id: string = null) {

    return new this(
      {
        sx: e.bokeh['sx'],
        sy: e.bokeh['sy'],
        delta_x: e.deltaX,
        delta_y: e.deltaY,
        direction: e.direction,
        model_id: model_id
      });
  }

  delta_x: number
  delta_y: number

  constructor(options: any = {}) {
    super(options)
    this.delta_x = options.delta_x;
    this.delta_y = options.delta_y;
  }
}

export class Pinch extends PointEvent {

  static event_name = 'pinch'

  static from_event(e: any, model_id: string = null) {
    return new this(
            {
              sx: e.bokeh['sx'],
              sy: e.bokeh['sy'],
              scale: e.scale,
              model_id: model_id
            });
  }

  scale: number

  constructor(options: any = {}) {
    super(options)
    this.scale = options.scale;
  }
}

export class MouseWheel extends PointEvent {

  static event_name = 'wheel'

  static from_event(e: any, model_id: string = null) {
    return new this(
      {
        sx: e.bokeh['sx'],
        sy: e.bokeh['sy'],
        delta: e.delta,
        model_id: model_id
      });
  }

  delta: number

  constructor(options: any = {}) {
    super(options)
    this.delta = options.delta;
  }
}

export class MouseMove extends PointEvent {
  static event_name = 'mousemove'
}

export class MouseEnter extends PointEvent {
  static event_name = 'mouseenter'
}

export class MouseLeave extends PointEvent {
  static event_name = 'mouseleave'
}

export class Tap extends PointEvent {
  static event_name = 'tap'
}

export class DoubleTap extends PointEvent {
  static event_name = 'doubletap'
}

export class Press extends PointEvent {
  static event_name = 'press'
}

export class PanStart extends PointEvent {
  static event_name = 'panstart'
}

export class PanEnd extends PointEvent {
  static event_name = 'panend'
}

export class PinchStart extends PointEvent {
  static event_name = 'pinchstart'
}

export class PinchEnd extends PointEvent {
  static event_name = 'pinchend'
}

BokehEvent.register_event_class(ButtonClick);
BokehEvent.register_event_class(LODStart);
BokehEvent.register_event_class(LODEnd);
BokehEvent.register_event_class(Pan);
BokehEvent.register_event_class(Pan);
BokehEvent.register_event_class(MouseWheel);
BokehEvent.register_event_class(MouseMove);
BokehEvent.register_event_class(MouseEnter);
BokehEvent.register_event_class(MouseLeave);
BokehEvent.register_event_class(Tap);
BokehEvent.register_event_class(DoubleTap);
BokehEvent.register_event_class(Press);
BokehEvent.register_event_class(PanStart);
BokehEvent.register_event_class(PanEnd);
BokehEvent.register_event_class(PinchStart);
BokehEvent.register_event_class(PinchEnd);
