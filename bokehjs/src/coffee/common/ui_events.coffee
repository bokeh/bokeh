
define [
  "jquery"
  "backbone"
  "hammer"
  "jquery_mousewheel"
  "common/logging"
], ($, Backbone, Hammer, mousewheel, Logging) ->

  logger = Logging.logger

  class UIEvents extends Backbone.Model

    initialize: (attrs, options) ->
      super(attrs, options)

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

      if et in ['pan', 'pinch', 'rotate']
        logger.debug("Registering tool: #{type} for event '#{et}'")
        if tool_view["_#{et}_start"]?
          tool_view.listenTo(@, "#{et}:start:#{id}", tool_view["_#{et}_start"])
        if tool_view["_#{et}"]
          tool_view.listenTo(@, "#{et}:#{id}",       tool_view["_#{et}"])
        if tool_view["_#{et}_end"]
          tool_view.listenTo(@, "#{et}:end:#{id}",   tool_view["_#{et}_end"])
      else if et == "move"
        logger.debug("Registering tool: #{type} for event '#{et}'")
        if tool_view._move_enter?
          tool_view.listenTo(@, "move:enter", tool_view._move_enter)
        tool_view.listenTo(@, "move", tool_view["_move"])
        if tool_view._move_exit?
          tool_view.listenTo(@, "move:exit", tool_view._move_exit)
      else
        logger.debug("Registering tool: #{type} for event '#{et}'")
        tool_view.listenTo(@, "#{et}:#{id}", tool_view["_#{et}"])

      if tool_view._keydown?
        logger.debug("Registering tool: #{type} for event 'keydown'")
        tool_view.listenTo(@, "keydown", tool_view._keydown)

      if tool_view._keyup?
        logger.debug("Registering tool: #{type} for event 'keyup'")
        tool_view.listenTo(@, "keyup", tool_view._keyup)

      if tool_view._doubletap?
        logger.debug("Registering tool: #{type} for event 'doubletap'")
        tool_view.listenTo(@, "doubletap", tool_view._doubletap)

    _trigger: (event_type, e) ->
      tm = @get('tool_manager')
      base_event_type = event_type.split(":")[0]
      gestures = tm.get('gestures')
      active = gestures[base_event_type].active
      if active?
        @trigger("#{event_type}:#{active.id}", e)

    _bokify_hammer: (e) ->
      if e.pointerType == "mouse"
        offset = $(e.target).offset()
        left = offset.left ? 0
        top = offset.top ? 0
        e.bokeh = {
          sx: e.srcEvent.pageX - left
          sy: e.srcEvent.pageY - top
        }
      else
        e.bokeh = {
          sx: e.center.x
          sy: e.center.y
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
      e.preventDefault()
      e.stopPropagation()

    _key_down: (e) ->
      # NOTE: keydown event triggered unconditionally
      @trigger('keydown', e)

    _key_up: (e) ->
      # NOTE: keyup event triggered unconditionally
      @trigger('keyup', e)

