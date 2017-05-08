import * as Hammer from "hammerjs"

import {Signal} from "./signaling"
import {logger} from "./logging"
import {offset} from "./dom"
import {getDeltaY} from "./util/wheel"
import {extend, isEmpty} from "./util/object"
import {BokehEvent} from "./bokeh_events"


export class UIEvents

  # new (plot_view: PlotCanvasView, toolbar: Toolbar, hit_area: Element, plot: Plot)
  constructor: (@plot_view, @toolbar, @hit_area, @plot) ->
    @tap          = new Signal(this, 'tap')
    @doubletap    = new Signal(this, 'doubletap')
    @press        = new Signal(this, 'press')
    @pan_start    = new Signal(this, 'pan:start')
    @pan          = new Signal(this, 'pan')
    @pan_end      = new Signal(this, 'pan:end')
    @pinch_start  = new Signal(this, 'pinch:start')
    @pinch        = new Signal(this, 'pinch')
    @pinch_end    = new Signal(this, 'pinch:end')
    @rotate_start = new Signal(this, 'rotate:start')
    @rotate       = new Signal(this, 'rotate')
    @rotate_end   = new Signal(this, 'rotate:end')
    @move_enter   = new Signal(this, 'move:enter')
    @move         = new Signal(this, 'move')
    @move_exit    = new Signal(this, 'move:exit')
    @scroll       = new Signal(this, 'scroll')
    @keydown      = new Signal(this, 'keydown')
    @keyup        = new Signal(this, 'keyup')

    @_configure_hammerjs()

  _configure_hammerjs: () ->
    @hammer = new Hammer(@hit_area)

    # This is to be able to distinguish double taps from single taps
    @hammer.get('doubletap').recognizeWith('tap')
    @hammer.get('tap').requireFailure('doubletap')
    @hammer.get('doubletap').dropRequireFailure('tap')

    @hammer.on('doubletap', (e) => @_doubletap(e))
    @hammer.on('tap', (e) => @_tap(e))
    @hammer.on('press', (e) => @_press(e))

    @hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL })
    @hammer.on('panstart', (e) => @_pan_start(e))
    @hammer.on('pan', (e) => @_pan(e))
    @hammer.on('panend', (e) => @_pan_end(e))

    @hammer.get('pinch').set({ enable: true })
    @hammer.on('pinchstart', (e) => @_pinch_start(e))
    @hammer.on('pinch', (e) => @_pinch(e))
    @hammer.on('pinchend', (e) => @_pinch_end(e))

    @hammer.get('rotate').set({ enable: true })
    @hammer.on('rotatestart', (e) => @_rotate_start(e))
    @hammer.on('rotate', (e) => @_rotate(e))
    @hammer.on('rotateend', (e) => @_rotate_end(e))

    @hit_area.addEventListener("mousemove", (e) => @_mouse_move(e))
    @hit_area.addEventListener("mouseenter", (e) => @_mouse_enter(e))
    @hit_area.addEventListener("mouseleave", (e) => @_mouse_exit(e))

    @hit_area.addEventListener("wheel", (e) => @_mouse_wheel(e))

    document.addEventListener("keydown", (e) => @_key_down(e))
    document.addEventListener("keyup", (e) => @_key_up(e))

  register_tool: (tool_view) ->
    et = tool_view.model.event_type
    id = tool_view.model.id
    type = tool_view.model.type

    # tool_viewbar button events handled by tool_view manager
    if not et?
      logger.debug("Button tool: #{type}")
      return

    v = tool_view

    switch et
      when "pan"
        if v._pan_start?    then v.connect(@pan_start,    (x) -> if x.id == id then v._pan_start(x.e))
        if v._pan?          then v.connect(@pan,          (x) -> if x.id == id then v._pan(x.e))
        if v._pan_end?      then v.connect(@pan_end,      (x) -> if x.id == id then v._pan_end(x.e))
      when "pinch"
        if v._pinch_start?  then v.connect(@pinch_start,  (x) -> if x.id == id then v._pinch_start(x.e))
        if v._pinch?        then v.connect(@pinch,        (x) -> if x.id == id then v._pinch(x.e))
        if v._pinch_end?    then v.connect(@pinch_end,    (x) -> if x.id == id then v._pinch_end(x.e))
      when "rotate"
        if v._rotate_start? then v.connect(@rotate_start, (x) -> if x.id == id then v._rotate_start(x.e))
        if v._rotate?       then v.connect(@rotate,       (x) -> if x.id == id then v._rotate(x.e))
        if v._rotate_end?   then v.connect(@rotate_end,   (x) -> if x.id == id then v._rotate_end(x.e))
      when "move"
        if v._move_enter?   then v.connect(@move_enter,   (x) -> if x.id == id then v._move_enter(x.e))
        if v._move?         then v.connect(@move,         (x) -> if x.id == id then v._move(x.e))
        if v._move_exit?    then v.connect(@move_exit,    (x) -> if x.id == id then v._move_exit(x.e))
      when "tap"
        if v._tap?          then v.connect(@tap,          (x) -> if x.id == id then v._tap(x.e))
      when "press"
        if v._press?        then v.connect(@press,        (x) -> if x.id == id then v._press(x.e))
      when "scroll"
        if v._scroll?       then v.connect(@scroll,       (x) -> if x.id == id then v._scroll(x.e))
      else
        throw new Error("unsupported event_type: #{ev}")

    if v._doubletap?
      v.connect(@doubletap, (x) -> v._doubletap(x.e))

    if v._keydown?
      v.connect(@keydown, (x) -> v._keydown(x.e))

    if v._keyup?
      v.connect(@keyup, (x) -> v._keyup(x.e))

    # Dual touch hack part 1/2
    # This is a hack for laptops with touch screen who may be pinching or scrolling
    # in order to use the wheel zoom tool. If it's a touch screen the WheelZoomTool event
    # will be linked to pinch. But we also want to trigger in the case of a scroll.
    if 'ontouchstart' of window or navigator.maxTouchPoints > 0
      if et == 'pinch'
        logger.debug("Registering scroll on touch screen")
        v.connect(@scroll, (x) -> if x.id == id then v._scroll(x.e))

  _hit_test_renderers: (sx, sy) ->
    for view in @plot_view.get_renderer_views() by -1
      if view.model.level in ['annotation', 'overlay'] and view.bbox?
        if view.bbox().contains(sx, sy)
          return view

    return null

  _hit_test_frame: (sx, sy) ->
    canvas = @plot_view.canvas
    vx = canvas.sx_to_vx(sx)
    vy = canvas.sy_to_vy(sy)
    return @plot_view.frame.contains(vx, vy)

  _trigger: (signal, e) ->
    event_type = signal.name
    base_type = event_type.split(":")[0]
    view = @_hit_test_renderers(e.bokeh.sx, e.bokeh.sy)

    switch base_type

      when "move"
        active_inspectors = @toolbar.inspectors.filter((t) -> return t.active)
        cursor = "default"

        # the event happened on a renderer
        if view?
          if view.model.cursor?
            cursor = view.model.cursor()
          if not isEmpty(active_inspectors)
            # override event_type to cause inspectors to clear overlays
            signal = @move_exit
            event_type = signal.name

        # the event happened on the plot frame but off a renderer
        else if @_hit_test_frame(e.bokeh.sx, e.bokeh.sy)
          if not isEmpty(active_inspectors)
            cursor = "crosshair"

        @plot_view.set_cursor(cursor)
        for inspector in active_inspectors
          @trigger(signal, e, inspector.id)

      when "tap"
        if view?
          view.on_hit?(e.bokeh.sx, e.bokeh.sy)
        active_gesture = @toolbar.gestures[base_type].active
        if active_gesture?
          @trigger(signal, e, active_gesture.id)

      when "scroll"
        # Dual touch hack part 2/2
        # This is a hack for laptops with touch screen who may be pinching or scrolling
        # in order to use the wheel zoom tool. If it's a touch screen the WheelZoomTool event
        # will be linked to pinch. But we also want to trigger in the case of a scroll.
        base = if 'ontouchstart' of window or navigator.maxTouchPoints > 0 then "pinch" else "scroll"
        active_gesture = @toolbar.gestures[base].active
        if active_gesture?
          e.preventDefault()
          e.stopPropagation()
          @trigger(signal, e, active_gesture.id)

      else
        active_gesture = @toolbar.gestures[base_type].active
        if active_gesture?
          @trigger(signal, e, active_gesture.id)

  trigger: (signal, event, id=null) ->
    signal.emit({id: id, e: event})

  _bokify_hammer: (e, extras={}) ->
    if e.pointerType == 'mouse'
      x = e.srcEvent.pageX
      y = e.srcEvent.pageY
    else
      x = e.pointers[0].pageX
      y = e.pointers[0].pageY
    {left, top} = offset(e.target)
    e.bokeh = {
      sx: x - left
      sy: y - top
    }
    e.bokeh = extend(e.bokeh, extras)
    event_cls = BokehEvent.event_class(e)
    if event_cls?
      @plot.trigger_event(event_cls.from_event(e))
    else
      logger.debug('Unhandled event of type ' + e.type)

  _bokify_point_event: (e, extras={}) ->

    {left, top} = offset(e.currentTarget)
    e.bokeh = {
      sx: e.pageX - left
      sy: e.pageY - top
    }
    e.bokeh = extend(e.bokeh, extras)
    event_cls = BokehEvent.event_class(e)
    if event_cls?
      @plot.trigger_event(event_cls.from_event(e))
    else
      logger.debug('Unhandled event of type ' + e.type)

  _tap: (e) ->
    @_bokify_hammer(e)
    @_trigger(@tap, e)

  _doubletap: (e) ->
    # NOTE: doubletap event triggered unconditionally
    @_bokify_hammer(e)
    @trigger(@doubletap, e)

  _press: (e) ->
    @_bokify_hammer(e)
    @_trigger(@press, e)

  _pan_start: (e) ->
    @_bokify_hammer(e)
    # back out delta to get original center point
    e.bokeh.sx -= e.deltaX
    e.bokeh.sy -= e.deltaY
    @_trigger(@pan_start, e)

  _pan: (e) ->
    @_bokify_hammer(e)
    @_trigger(@pan, e)

  _pan_end: (e) ->
    @_bokify_hammer(e)
    @_trigger(@pan_end, e)

  _pinch_start: (e) ->
    @_bokify_hammer(e)
    @_trigger(@pinch_start, e)

  _pinch: (e) ->
    @_bokify_hammer(e)
    @_trigger(@pinch, e)

  _pinch_end: (e) ->
    @_bokify_hammer(e)
    @_trigger(@pinch_end, e)

  _rotate_start: (e) ->
    @_bokify_hammer(e)
    @_trigger(@rotate_start, e)

  _rotate: (e) ->
    @_bokify_hammer(e)
    @_trigger(@rotate, e)

  _rotate_end: (e) ->
    @_bokify_hammer(e)
    @_trigger(@rotate_end, e)

  _mouse_enter: (e) ->
    @_bokify_point_event(e)
    @_trigger(@move_enter, e)

  _mouse_move: (e) ->
    @_bokify_point_event(e)
    @_trigger(@move, e)

  _mouse_exit: (e) ->
    @_bokify_point_event(e)
    @_trigger(@move_exit, e)

  _mouse_wheel: (e) ->
    @_bokify_point_event(e, {delta: getDeltaY(e)})
    @_trigger(@scroll, e)

  _key_down: (e) ->
    # NOTE: keyup event triggered unconditionally
    @trigger(@keydown, e)

  _key_up: (e) ->
    # NOTE: keyup event triggered unconditionally
    @trigger(@keyup, e)
