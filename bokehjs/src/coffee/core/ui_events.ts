/* XXX: partial */
import * as Hammer from "hammerjs";

import {Signal} from "./signaling";
import {logger} from "./logging";
import {offset} from "./dom";
import {getDeltaY} from "./util/wheel";
import {includes} from "./util/array";
import {extend, isEmpty} from "./util/object";
import {BokehEvent} from "./bokeh_events"

export class UIEvents {

  // new (plot_view: PlotCanvasView, toolbar: Toolbar, hit_area: Element, plot: Plot)
  constructor(plot_view, toolbar, hit_area, plot) {
    this.plot_view = plot_view;
    this.toolbar = toolbar;
    this.hit_area = hit_area;
    this.plot = plot;
    this.tap          = new Signal(this, 'tap');
    this.doubletap    = new Signal(this, 'doubletap');
    this.press        = new Signal(this, 'press');
    this.pan_start    = new Signal(this, 'pan:start');
    this.pan          = new Signal(this, 'pan');
    this.pan_end      = new Signal(this, 'pan:end');
    this.pinch_start  = new Signal(this, 'pinch:start');
    this.pinch        = new Signal(this, 'pinch');
    this.pinch_end    = new Signal(this, 'pinch:end');
    this.rotate_start = new Signal(this, 'rotate:start');
    this.rotate       = new Signal(this, 'rotate');
    this.rotate_end   = new Signal(this, 'rotate:end');
    this.move_enter   = new Signal(this, 'move:enter');
    this.move         = new Signal(this, 'move');
    this.move_exit    = new Signal(this, 'move:exit');
    this.scroll       = new Signal(this, 'scroll');
    this.keydown      = new Signal(this, 'keydown');
    this.keyup        = new Signal(this, 'keyup');

    this._configure_hammerjs();
  }

  _configure_hammerjs() {
    this.hammer = new Hammer(this.hit_area);

    // This is to be able to distinguish double taps from single taps
    this.hammer.get('doubletap').recognizeWith('tap');
    this.hammer.get('tap').requireFailure('doubletap');
    this.hammer.get('doubletap').dropRequireFailure('tap');

    this.hammer.on('doubletap', e => this._doubletap(e));
    this.hammer.on('tap', e => this._tap(e));
    this.hammer.on('press', e => this._press(e));

    this.hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    this.hammer.on('panstart', e => this._pan_start(e));
    this.hammer.on('pan', e => this._pan(e));
    this.hammer.on('panend', e => this._pan_end(e));

    this.hammer.get('pinch').set({ enable: true });
    this.hammer.on('pinchstart', e => this._pinch_start(e));
    this.hammer.on('pinch', e => this._pinch(e));
    this.hammer.on('pinchend', e => this._pinch_end(e));

    this.hammer.get('rotate').set({ enable: true });
    this.hammer.on('rotatestart', e => this._rotate_start(e));
    this.hammer.on('rotate', e => this._rotate(e));
    this.hammer.on('rotateend', e => this._rotate_end(e));

    this.hit_area.addEventListener("mousemove", e => this._mouse_move(e));
    this.hit_area.addEventListener("mouseenter", e => this._mouse_enter(e));
    this.hit_area.addEventListener("mouseleave", e => this._mouse_exit(e));

    this.hit_area.addEventListener("wheel", e => this._mouse_wheel(e));

    document.addEventListener("keydown", e => this._key_down(e));
    return document.addEventListener("keyup", e => this._key_up(e));
  }

  register_tool(tool_view, event_type) {
    let e;
    const et = event_type || tool_view.model.event_type;
    if ((et != null) && !(typeof et === 'string')) {
      for (e of et) {
        this.register_tool(tool_view, e);
      }
      return;
    }

    const { id } = tool_view.model;
    const { type } = tool_view.model;

    // tool_viewbar button events handled by tool_view manager
    if ((et == null)) {
      logger.debug(`Button tool: ${type}`);
      return;
    }

    const v = tool_view;

    switch (et) {
      case "pan":
        if (v._pan_start != null) {    v.connect(this.pan_start,    function(x) { if (x.id === id) { return v._pan_start(x.e); } }); }
        if (v._pan != null) {          v.connect(this.pan,          function(x) { if (x.id === id) { return v._pan(x.e); } }); }
        if (v._pan_end != null) {      v.connect(this.pan_end,      function(x) { if (x.id === id) { return v._pan_end(x.e); } }); }
        break;
      case "pinch":
        if (v._pinch_start != null) {  v.connect(this.pinch_start,  function(x) { if (x.id === id) { return v._pinch_start(x.e); } }); }
        if (v._pinch != null) {        v.connect(this.pinch,        function(x) { if (x.id === id) { return v._pinch(x.e); } }); }
        if (v._pinch_end != null) {    v.connect(this.pinch_end,    function(x) { if (x.id === id) { return v._pinch_end(x.e); } }); }
        break;
      case "rotate":
        if (v._rotate_start != null) { v.connect(this.rotate_start, function(x) { if (x.id === id) { return v._rotate_start(x.e); } }); }
        if (v._rotate != null) {       v.connect(this.rotate,       function(x) { if (x.id === id) { return v._rotate(x.e); } }); }
        if (v._rotate_end != null) {   v.connect(this.rotate_end,   function(x) { if (x.id === id) { return v._rotate_end(x.e); } }); }
        break;
      case "move":
        if (v._move_enter != null) {   v.connect(this.move_enter,   function(x) { if (x.id === id) { return v._move_enter(x.e); } }); }
        if (v._move != null) {         v.connect(this.move,         function(x) { if (x.id === id) { return v._move(x.e); } }); }
        if (v._move_exit != null) {    v.connect(this.move_exit,    function(x) { if (x.id === id) { return v._move_exit(x.e); } }); }
        break;
      case "tap":
        if (v._tap != null) {          v.connect(this.tap,          function(x) { if (x.id === id) { return v._tap(x.e); } }); }
        break;
      case "press":
        if (v._press != null) {        v.connect(this.press,        function(x) { if (x.id === id) { return v._press(x.e); } }); }
        break;
      case "scroll":
        if (v._scroll != null) {       v.connect(this.scroll,       function(x) { if (x.id === id) { return v._scroll(x.e); } }); }
        break;
      default:
        throw new Error(`unsupported event_type: ${et}`);
    }

    if (v._doubletap != null) {
      v.connect(this.doubletap, x => v._doubletap(x.e));
    }

    if (v._keydown != null) {
      v.connect(this.keydown, x => v._keydown(x.e));
    }

    if (v._keyup != null) {
      v.connect(this.keyup, x => v._keyup(x.e));
    }

    // Dual touch hack part 1/2
    // This is a hack for laptops with touch screen who may be pinching or scrolling
    // in order to use the wheel zoom tool. If it's a touch screen the WheelZoomTool event
    // will be linked to pinch. But we also want to trigger in the case of a scroll.
    if ('ontouchstart' in window || (navigator.maxTouchPoints > 0)) {
      if (et === 'pinch') {
        logger.debug("Registering scroll on touch screen");
        return v.connect(this.scroll, function(x) { if (x.id === id) { return v._scroll(x.e); } });
      }
    }
  }

  _hit_test_renderers(sx, sy) {
    const iterable = this.plot_view.get_renderer_views();
    for (let i = iterable.length - 1; i >= 0; i--) {
      const view = iterable[i];
      if (includes(['annotation', 'overlay'], view.model.level) && (view.bbox != null)) {
        if (view.bbox().contains(sx, sy)) {
          return view;
        }
      }
    }

    return null;
  }

  _hit_test_frame(sx, sy) {
    return this.plot_view.frame.bbox.contains(sx, sy);
  }

  _trigger(signal, e): void {
    let event_type = signal.name;
    const base_type = event_type.split(":")[0];
    const view = this._hit_test_renderers(e.bokeh.sx, e.bokeh.sy);

    switch (base_type) {
      case "move": {
        const active_gesture = this.toolbar.gestures[base_type].active;
        if (active_gesture != null)
          this.trigger(signal, e, active_gesture.id);

        const active_inspectors = this.toolbar.inspectors.filter(t => t.active);
        let cursor = "default";

        // the event happened on a renderer
        if (view != null) {
          if (view.model.cursor != null) {
            cursor = view.model.cursor();
          }
          if (!isEmpty(active_inspectors)) {
            // override event_type to cause inspectors to clear overlays
            signal = this.move_exit;
            event_type = signal.name;
          }

        // the event happened on the plot frame but off a renderer
        } else if (this._hit_test_frame(e.bokeh.sx, e.bokeh.sy)) {
          if (!isEmpty(active_inspectors)) {
            cursor = "crosshair";
          }
        }

        this.plot_view.set_cursor(cursor);
        active_inspectors.map((inspector) => this.trigger(signal, e, inspector.id));
        break
      }
      case "tap": {
        if (view != null) {
          if (typeof view.on_hit === 'function') {
            view.on_hit(e.bokeh.sx, e.bokeh.sy);
          }
        }
        const active_gesture = this.toolbar.gestures[base_type].active;
        if (active_gesture != null) {
          this.trigger(signal, e, active_gesture.id);
        }
        break;
      }
      case "scroll": {
        // Dual touch hack part 2/2
        // This is a hack for laptops with touch screen who may be pinching or scrolling
        // in order to use the wheel zoom tool. If it's a touch screen the WheelZoomTool event
        // will be linked to pinch. But we also want to trigger in the case of a scroll.
        const base = 'ontouchstart' in window || (navigator.maxTouchPoints > 0) ? "pinch" : "scroll";
        const active_gesture = this.toolbar.gestures[base].active;
        if (active_gesture != null) {
          e.preventDefault();
          e.stopPropagation();
          this.trigger(signal, e, active_gesture.id);
        }
        break;
      }
      default: {
        const active_gesture = this.toolbar.gestures[base_type].active;
        if (active_gesture != null)
          this.trigger(signal, e, active_gesture.id);
      }
    }
  }

  trigger(signal, event, id=null) {
    return signal.emit({id, e: event});
  }

  _event_sxy(event) {
    const {left, top} = offset(this.hit_area);
    return {
      sx: event.pageX - left,
      sy: event.pageY - top,
    };
  }

  _bokify_hammer(e, extras = {}) {
    e.bokeh = extend(this._event_sxy(e.srcEvent), extras);
    const event_cls = BokehEvent.event_class(e);
    if (event_cls != null) {
      return this.plot.trigger_event(event_cls.from_event(e));
    } else {
      return logger.debug(`Unhandled event of type ${e.type}`);
    }
  }

  _bokify_point_event(e, extras = {}) {
    e.bokeh = extend(this._event_sxy(e), extras);
    const event_cls = BokehEvent.event_class(e);
    if (event_cls != null) {
      return this.plot.trigger_event(event_cls.from_event(e));
    } else {
      return logger.debug(`Unhandled event of type ${e.type}`);
    }
  }

  _tap(e) {
    this._bokify_hammer(e);
    return this._trigger(this.tap, e);
  }

  _doubletap(e) {
    // NOTE: doubletap event triggered unconditionally
    this._bokify_hammer(e);
    return this.trigger(this.doubletap, e);
  }

  _press(e) {
    this._bokify_hammer(e);
    return this._trigger(this.press, e);
  }

  _pan_start(e) {
    this._bokify_hammer(e);
    // back out delta to get original center point
    e.bokeh.sx -= e.deltaX;
    e.bokeh.sy -= e.deltaY;
    return this._trigger(this.pan_start, e);
  }

  _pan(e) {
    this._bokify_hammer(e);
    return this._trigger(this.pan, e);
  }

  _pan_end(e) {
    this._bokify_hammer(e);
    return this._trigger(this.pan_end, e);
  }

  _pinch_start(e) {
    this._bokify_hammer(e);
    return this._trigger(this.pinch_start, e);
  }

  _pinch(e) {
    this._bokify_hammer(e);
    return this._trigger(this.pinch, e);
  }

  _pinch_end(e) {
    this._bokify_hammer(e);
    return this._trigger(this.pinch_end, e);
  }

  _rotate_start(e) {
    this._bokify_hammer(e);
    return this._trigger(this.rotate_start, e);
  }

  _rotate(e) {
    this._bokify_hammer(e);
    return this._trigger(this.rotate, e);
  }

  _rotate_end(e) {
    this._bokify_hammer(e);
    return this._trigger(this.rotate_end, e);
  }

  _mouse_enter(e) {
    this._bokify_point_event(e);
    return this._trigger(this.move_enter, e);
  }

  _mouse_move(e) {
    this._bokify_point_event(e);
    return this._trigger(this.move, e);
  }

  _mouse_exit(e) {
    this._bokify_point_event(e);
    return this._trigger(this.move_exit, e);
  }

  _mouse_wheel(e) {
    this._bokify_point_event(e, {delta: getDeltaY(e)});
    return this._trigger(this.scroll, e);
  }

  _key_down(e) {
    // NOTE: keyup event triggered unconditionally
    return this.trigger(this.keydown, e);
  }

  _key_up(e) {
    // NOTE: keyup event triggered unconditionally
    return this.trigger(this.keyup, e);
  }
}
