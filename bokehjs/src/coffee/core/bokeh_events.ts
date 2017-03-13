import { logger } from "./logging"

export class Event {
  static _event_classes = {}

  constructor(options = {}) {
    this._options = options;
    if (options.model_id) {
      this.model_id = options.model_id
    }
  }

  set_model_id(id) {
    this._options.model_id = id;
    this.model_id = id;
    return this
  }

  static event_class(e) {
    // Given an event with a type attribute matching the event_name,
    // return the appropriate Event class
    if (e.type) {
      return this._event_classes[e.type];
    }
    else {
      logger.warn('Event.event_class required events with a string type attribute')
    }
  }

  toJSON() {
    if (this.constructor.event_name) {
      return {
        event_name: this.constructor.event_name,
        event_values: this._options
      };
    }
    else {
      throw Error('All events need to have an event name.')
    }
  }

  _customize_event(model) {
    return this
  }

  static register_event_class(name, event_cls) {
    Event._event_classes[name] = event_cls
  }
}

export class ButtonClick extends Event {
  static event_name = 'button_click'
  static applicable_models = ['Button']
}


export class UIEvent extends Event {
  // A UIEvent is an event originating on a PlotCanvas this includes
  // DOM events such as keystrokes as well as hammer events and LOD events.
  static applicable_models = ['Plot']
}


export class LODStart extends UIEvent {
  static event_name = 'lodstart'
}

export class LODEnd extends UIEvent {
  static event_name = 'lodend'
}


export class PointEvent extends UIEvent {

    constructor(options) {
      this.sx = options.sx;
      this.sy = options.sy;
      this.x = null;
      this.y = null;
      super(options)
    }

  static from_event(e, model_id = null) {
    return new this({ sx: e.bokeh['sx'], sy: e.bokeh['sy'], model_id: model_id });
  }

  _customize_event(plot) {
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

  static from_event(e, model_id = null) {

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

  constructor(options = {}) {
    this.delta_x = options.delta_x;
    this.delta_y = options.delta_y;
    super(options)
  }
}

export class Pinch extends PointEvent {

  static event_name = 'pinch'

  static from_event(e, model_id = null) {
    return new this(
            {
              sx: e.bokeh['sx'],
              sy: e.bokeh['sy'],
              scale: e.scale,
              model_id: model_id
            });
  }

  constructor(options = {}) {
    this.scale = options.scale;
    super(options)
  }
}

export class MouseWheel extends PointEvent {

  static event_name = 'wheel'

  static from_event(e, model_id = null) {
    return new this(
      {
        sx: e.bokeh['sx'],
        sy: e.bokeh['sy'],
        delta: e.delta,
        model_id: model_id
      });
  }

  constructor(options = {}) {
    this.delta = options.delta;
    super(options)
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

Event.register_event_class('lodstart', ButtonClick);
Event.register_event_class('lodstart', LODStart);
Event.register_event_class('lodend', LODEnd);
Event.register_event_class('pan', Pan);
Event.register_event_class('pinch', Pan);
Event.register_event_class('wheel', MouseWheel);
Event.register_event_class('mousemove', MouseMove);
Event.register_event_class('mouseenter', MouseEnter);
Event.register_event_class('mouseleave', MouseLeave);
Event.register_event_class('tap', Tap);
Event.register_event_class('doubletap', DoubleTap);
Event.register_event_class('press', Press);
Event.register_event_class('panstart', PanStart);
Event.register_event_class('panend', PanEnd);
Event.register_event_class('pinchstart', PinchStart);
Event.register_event_class('pinchend', PinchEnd);
