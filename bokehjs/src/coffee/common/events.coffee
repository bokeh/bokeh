
define [
  "backbone"
  "hammer"
  "jquery_mousewheel"
], (Backbone, Hammer, mousewheel) ->

  class Events extends Backbone.Model

    initialize: (attrs, options) ->
      super(attrs, options)

      hit_area = @get('hit_area')

      @hammer = new Hammer(hit_area[0])

      @hammer.on('tap', (e) => @_tap(e))
      @hammer.on('doubletap', (e) => @_doubletap(e))
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
      hit_area.mousewheel((e, delta) => @_mouse_wheel(e, delta))
      $(document).keydown((e) => @_key_down(e))
      $(document).keyup((e) => @_key_up(e))

    register_tool: (tool_view) ->
      et = tool_view.mget('event_type')
      id = tool_view.mget('id')

      # tool_viewbar button events handled by tool_view manager
      if not et?
        return

      if et in ['pan', 'pinch', 'rotate']
        if tool_view["_#{et}_start"]?
          tool_view.listenTo(@, "#{et}:start:#{id}", tool_view["_#{et}_start"])
        if tool_view["_#{et}"]
          tool_view.listenTo(@, "#{et}:#{id}",       tool_view["_#{et}"])
        if tool_view["_#{et}_end"]
          tool_view.listenTo(@, "#{et}:end:#{id}",   tool_view["_#{et}_end"])
      else if et == "move"
        tool_view.listenTo(@, "#{et}", tool_view["_#{et}"])
      else
        tool_view.listenTo(@, "#{et}:#{id}", tool_view["_#{et}"])

      if tool_view._keydown?
        tool_view.listenTo(@, "keydown", tool_view._keydown)

      if tool_view._keyup?
        tool_view.listenTo(@, "keyup", tool_view._keyup)

    _trigger: (event_type, e) ->
      tm = @get('tool_manager')
      base_event_type = event_type.split(":")[0]
      active = tm.get(base_event_type).active
      if active?
        @trigger("#{event_type}:#{active.id}", e)

    _bokify: (e) ->
      if e.pointerType == "mouse"
        offset = $(e.target).offset()
        left = if offset? then offset.left else 0
        top = if offset? then offset.top else 0
        e.bokeh = {
          sx: e.srcEvent.pageX - left
          sy: e.srcEvent.pageY - top
        }
      else
        e.bokeh = {
          sx: e.center.x
          sy: e.center.y
        }

    _tap: (e) ->
      @_bokify(e)
      @_trigger('tap', e)

    _doubletap: (e) ->
      @_trigger('doubletap', e)

    _press: (e) ->
      @_trigger('press', e)

    _pan_start: (e) ->
      @_trigger('pan:start', e)

    _pan: (e) ->
      @_trigger('pan', e)

    _pan_end: (e) ->
      @_trigger('pan:end', e)

    _pinch_start: (e) ->
      @_trigger('pinch:start', e)

    _pinch: (e) ->
      @_trigger('pinch', e)

    _pinch_end: (e) ->
      @_trigger('pinch:end', e)

    _rotate_start: (e) ->
      @_trigger('rotate:start', e)

    _rotate: (e) ->
      @_trigger('rotate', e)

    _rotate_end: (e) ->
      @_trigger('rotate:end', e)

    _mouse_move: (e) ->
      # NOTE: move event triggered unconditionally
      @trigger('move', e)

    _mouse_wheel: (e, delta) ->
      e.delta = delta
      offset = $(e.currentTarget).offset()
      left = if offset? then offset.left else 0
      top = if offset? then offset.top else 0
      e.sx = e.pageX - left
      e.sy = e.pageY - top
      @_trigger('scroll', e)
      e.preventDefault()
      e.stopPropagation()

    _key_down: (e) ->
      # NOTE: keydown event triggered unconditionally
      @trigger('keydown', e)

    _key_up: (e) ->
      # NOTE: keyup event triggered unconditionally
      @trigger('keyup', e)

