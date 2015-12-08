$ = require "jquery"
Backbone = require "backbone"
Hammer = require "hammerjs"
mousewheel = require("jquery-mousewheel")($)
{logger} = require "./logging"

class UIEvents extends Backbone.Model

  initialize: (attrs, options) ->
    super(attrs, options)
    @_hammer_element()


  _hammer_element: ->
    hit_area = @get('hit_area')
    @hammer = new Hammer(hit_area[0])

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

    hit_area.mousemove((e) => @_mouse_move(e))
    hit_area.mouseenter((e) => @_mouse_enter(e))
    hit_area.mouseleave((e) => @_mouse_exit(e))
    hit_area.mousewheel((e, delta) => @_mouse_wheel(e, delta))
    $(document).keydown((e) => @_key_down(e))
    $(document).keyup((e) => @_key_up(e))


  register_tool: (tool_view) ->
    et = tool_view.mget('event_type')
    id = tool_view.mget('id')
    type = tool_view.model.type

    # tool_viewbar button events handled by tool_view manager
    if not et?
      logger.debug("Button tool: #{type}")
      return

    listenTo = (event_name, method_name) =>
      if tool_view[method_name]?
        tool_view.listenTo(@, event_name, () -> tool_view[method_name].apply(tool_view, arguments))

    if et in ['pan', 'pinch', 'rotate']
      logger.debug("Registering tool: #{type} for event '#{et}'")
      listenTo("#{et}:start:#{id}", "_#{et}_start")
      listenTo("#{et}:#{id}",       "_#{et}")
      listenTo("#{et}:end:#{id}",   "_#{et}_end")
    else if et == "move"
      logger.debug("Registering tool: #{type} for event '#{et}'")
      listenTo("move:enter", "_move_enter")
      listenTo("move", "_move")
      listenTo("move:exit", "_move_exit")
    else
      logger.debug("Registering tool: #{type} for event '#{et}'")
      listenTo("#{et}:#{id}", "_#{et}")

    if tool_view._keydown?
      logger.debug("Registering tool: #{type} for event 'keydown'")
      listenTo("keydown", "_keydown")

    if tool_view._keyup?
      logger.debug("Registering tool: #{type} for event 'keyup'")
      listenTo("keyup", "_keyup")

    if tool_view._doubletap?
      logger.debug("Registering tool: #{type} for event 'doubletap'")
      listenTo("doubletap", "_doubletap")

  _trigger: (event_type, e) ->
    tm = @get('tool_manager')
    base_event_type = event_type.split(":")[0]
    gestures = tm.get('gestures')
    active_tool = gestures[base_event_type].active
    if active_tool?
      @_trigger_event(event_type, active_tool, e)

  _trigger_event: (event_type, active_tool, e)->
    if active_tool.get('active') == true
      if event_type == 'scroll'
        e.preventDefault()
        e.stopPropagation()
      @trigger("#{event_type}:#{active_tool.id}", e)

  _bokify_hammer: (e) ->
    if e.pointerType == 'mouse'
      x = e.srcEvent.pageX
      y = e.srcEvent.pageY
    else
      x = e.center.x
      y = e.center.y
    offset = $(e.target).offset()
    left = offset.left ? 0
    top = offset.top ? 0
    e.bokeh = {
      sx: x - left
      sy: y - top
    }

  _bokify_jq: (e) ->
    offset = $(e.currentTarget).offset()
    left = offset.left ? 0
    top = offset.top ? 0
    e.bokeh = {
      sx: e.pageX - left
      sy: e.pageY - top
    }

  _tap: (e) ->
    @_bokify_hammer(e)
    @_trigger('tap', e)

  _doubletap: (e) ->
    # NOTE: doubletap event triggered unconditionally
    @_bokify_hammer(e)
    @trigger('doubletap', e)

  _press: (e) ->
    @_bokify_hammer(e)
    @_trigger('press', e)

  _pan_start: (e) ->
    @_bokify_hammer(e)
    # back out delta to get original center point
    e.bokeh.sx -= e.deltaX
    e.bokeh.sy -= e.deltaY
    @_trigger('pan:start', e)

  _pan: (e) ->
    @_bokify_hammer(e)
    @_trigger('pan', e)

  _pan_end: (e) ->
    @_bokify_hammer(e)
    @_trigger('pan:end', e)

  _pinch_start: (e) ->
    @_bokify_hammer(e)
    @_trigger('pinch:start', e)

  _pinch: (e) ->
    @_bokify_hammer(e)
    @_trigger('pinch', e)

  _pinch_end: (e) ->
    @_bokify_hammer(e)
    @_trigger('pinch:end', e)

  _rotate_start: (e) ->
    @_bokify_hammer(e)
    @_trigger('rotate:start', e)

  _rotate: (e) ->
    @_bokify_hammer(e)
    @_trigger('rotate', e)

  _rotate_end: (e) ->
    @_bokify_hammer(e)
    @_trigger('rotate:end', e)

  _mouse_enter: (e) ->
    # NOTE: move:enter event triggered unconditionally
    @_bokify_jq(e)
    @trigger('move:enter', e)

  _mouse_move: (e) ->
    # NOTE: move event triggered unconditionally
    @_bokify_jq(e)
    @trigger('move', e)

  _mouse_exit: (e) ->
    # NOTE: move:exit event triggered unconditionally
    @_bokify_jq(e)
    @trigger('move:exit', e)

  _mouse_wheel: (e, delta) ->
    @_bokify_jq(e)
    e.bokeh.delta = delta
    @_trigger('scroll', e)

  _key_down: (e) ->
    # NOTE: keydown event triggered unconditionally
    @trigger('keydown', e)

  _key_up: (e) ->
    # NOTE: keyup event triggered unconditionally
    @trigger('keyup', e)

module.exports = UIEvents
