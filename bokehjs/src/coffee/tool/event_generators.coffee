
define [], () ->

  set_bokehXY = (event) ->
    offset = $(event.currentTarget).offset()
    left = if offset? then offset.left else 0
    top = if offset? then offset.top else 0
    touch = 'ontouchstart' of document.documentElement
    if touch
      if event.originalEvent.touches.length != 0
        X = event.originalEvent.touches[0].pageX
        Y = event.originalEvent.touches[0].pageY
      else
        X = event.originalEvent.changedTouches[0].pageX
        Y = event.originalEvent.changedTouches[0].pageY
    pageX = (if touch then X else event.pageX)
    pageY = (if touch then Y else event.pageY)
    event.bokehX = pageX - left
    event.bokehY = pageY - top
    # For touch devices second finger
    if touch
      double_touch = true
      if event.originalEvent.touches.length > 1
        X1 = event.originalEvent.touches[1].pageX
        Y1 = event.originalEvent.touches[1].pageY
      else if event.originalEvent.changedTouches.length > 1
        X1 = event.originalEvent.changedTouches[1].pageX
        Y1 = event.originalEvent.changedTouches[1].pageY
      else
        double_touch = false
      if double_touch
        pageX1 = X1
        pageY1 = Y1
        event.bokehX1 = pageX1 - left
        event.bokehY1 = pageY1 - top

  class TwoPointEventGenerator

    constructor: (options) ->
      @restrict_to_innercanvas = options.restrict_to_innercanvas
      @options = options
      @toolName = @options.eventBasename
      @dragging = false
      @basepoint_set = false
      @button_activated = false
      @tool_active = false
      @touch = 'ontouchstart' of document.documentElement
      @frame_view = ""

    bind_bokeh_events: (plotview, eventSink) ->
      if @options.touch_event? && not @options.touch_event
        return null
      if @options.button_disable? and @options.button_disable
        button_disabled = "disabled"
      if @frame_view == ""
        @frame_view = plotview.view_state.get('frame')
      if not plotview.view_state.get('resize_plot') and @options.buttonText.toLowerCase() is 'resize'
        return null
      toolName = @toolName
      @plotview = plotview
      @eventSink = eventSink
      @plotview.moveCallbacks.push((e, x, y) =>
        if not @dragging
          return
        if not @tool_active
          return

        set_bokehXY(e)

        if not @basepoint_set
          @dragging = true
          @basepoint_set = true
          @touch_count = 0
          @start_time = 0
          eventSink.trigger("#{toolName}:SetBasepoint", e)
        else
          eventSink.trigger("#{toolName}:UpdatingMouseMove", e)
          e.preventDefault()
          e.stopPropagation()
        )
      @plotview.moveCallbacks.push((e, x, y) =>
        if @dragging
          set_bokehXY(e)
          inner_range_horizontal = @plotview.view_state.get(
            'inner_range_horizontal')
          inner_range_vertical = @plotview.view_state.get(
            'inner_range_vertical')
          x = @plotview.view_state.sx_to_vx(e.bokehX)
          y = @plotview.view_state.sy_to_vy(e.bokehY)
          if @restrict_to_innercanvas
            xstart = inner_range_horizontal.get('start')
            xend = inner_range_horizontal.get('end')
            ystart = inner_range_vertical.get('start')
            yend = inner_range_vertical.get('end')
          else
            xstart = 0
            xend = @plotview.view_state.get('outer_width')
            ystart = 0
            yend = @plotview.view_state.get('outer_height')
          if x < xstart  or x > xend
            @_stop_drag(e)
            return false
          if y < ystart or y > yend
            @_stop_drag(e)
            return false
      )
      $(document).bind('keydown', (e) =>
        if e.keyCode == 27 # ESC
          eventSink.trigger("clear_active_tool"))

      $(document).bind('keyup', (e) =>
        if not e[@options.keyName]
          @_stop_drag(e))
              
      startClick = if @touch then 'touchstart' else 'mousedown'
       
      @plotview.canvas_wrapper.bind 'click', (e) =>
        if @frame_view == "onfocus"
          @plotview.canvas_header.removeClass('hide')
          @plotview.canvas_footer.removeClass('hide')
          @plotview.$el.find('.plotarea').addClass('frame')
      
      @plotview.canvas_wrapper.bind startClick, (e) =>
        @touch_count = 0
        start = false

        if @button_activated or @eventSink.active == @toolName
          start = true
        else if not @eventSink.active
          if @options.keyName is null and not e.ctrlKey and not e.altKey and not e.metaKey and not e.shiftKey
            start = true
          else if e[@options.keyName] is true
            start = true

        if start
          @_start_drag()
          return false

      endClick = if @touch then 'touchend' else 'mouseup'
      
      $(document).bind(endClick, (e) =>
        if !e.target.className.match(/gear-icon/)
          @plotview.$el.find('.popup_menu').removeClass('show_popup')
        else
          @plotview._close_modal_window())

      @plotview.frame_close.bind(endClick, (e) =>
        if @frame_view == "on"
          @frame_view = "off"
        @plotview.canvas_header.addClass('hide')
        @plotview.canvas_footer.addClass('hide')
        @plotview._close_modal_window()
        @plotview.$el.find('.plotarea').removeClass('frame'))
      
      @plotview.canvas_wrapper.bind(endClick, (e) =>
        @plotview.$el.find('.popup_menu').removeClass('show_popup')
        if @button_activated
          # To detect the two finger touch end
          if @touch
            if @touch_count == 0
              @start_time = new Date().getTime()
              @touch_count += 1
            if e.originalEvent.touches.length != 0
              return false
          @_stop_drag(e)
          return false)
      @plotview.canvas_wrapper.bind('mouseleave', (e) =>
        if @button_activated
          @_stop_drag(e)
          return false)

      if @plotview.view_state.get('resize_plot') and @options.buttonText.toLowerCase() is 'resize'
        if @touch
          @$tool_button = $("<i class='resize-icon icon-fullscreen'></i>")
          @plotview.$el.find('.button_icon').append(@$tool_button)
        else
          @$tool_button = $("<div class='resize_bokeh_plot'></div>")
          @plotview.canvas_wrapper.append(@$tool_button)
      else
        @$tool_button = $("<button class='btn btn-small' #{button_disabled}> #{@options.buttonText} </button>")
        @plotview.$el.find('.button_bar').append(@$tool_button)
      
      # Paddy: I want to remove all this checking for @button_activated,
      # is there some way we can do this in a more declarative way,
      # maybe a state machine?
      #
      # What is the difference between tool_active and button_activated?
      # I once knew, but now I forget
      if @plotview.view_state.get('resize_plot') and @options.buttonText.toLowerCase() is 'resize' and not @touch
        @$tool_button.mousedown(=>
          if not @button_activated
            eventSink.trigger("active_tool", toolName))
        $(document).bind('mouseup', (e) =>
          if @$tool_button[0].className.match(/resize_bokeh_plot/)
            if @button_activated
              eventSink.trigger("clear_active_tool"))
        @$tool_button.mouseup(=>
          if @button_activated
            eventSink.trigger("clear_active_tool"))
      else
        @$tool_button.click(=>
          if @button_activated
            eventSink.trigger("clear_active_tool")
          else
            eventSink.trigger("active_tool", toolName))

      eventSink.on("#{toolName}:deactivated", =>
        @tool_active=false;
        @button_activated = false;
        @$tool_button.removeClass('active'))

      eventSink.on("#{toolName}:activated", =>
        @tool_active=true;
        @$tool_button.addClass('active')
        @button_activated = true)
      return eventSink

    hide_button: ->
      @$tool_button.hide()

    _start_drag: ->
      @_activated_with_button = @button_activated
      @eventSink.trigger("active_tool", @toolName)
      if not @dragging
        @dragging = true
        if not @button_activated
          @$tool_button.addClass('active')
        if @options.cursor?
          @plotview.canvas_wrapper.css('cursor', @options.cursor)

    _stop_drag: (e)->
      @basepoint_set = false
      if @dragging
        @dragging = false
        if @_activated_with_button is false and @options.auto_deactivate is true
          @eventSink.trigger("clear_active_tool")
        if not @button_activated
          @$tool_button.removeClass('active')
        if @options.cursor?
          @plotview.canvas_wrapper.css('cursor', '')
        if not @touch
          set_bokehXY(e)
        if not @options.gesture? or (@options.gesture? and not @options.gesture)
          @eventSink.trigger("#{@options.eventBasename}:DragEnd", e)
        else if @options.gesture
          time_taken = new Date().getTime() - @start_time
          @start_time = 0
          @eventSink.trigger("#{@options.eventBasename}:DragEnd", [e, time_taken])
      @_activated_with_button = null

  class OnePointWheelEventGenerator

    constructor: (options) ->
      @options = options
      @toolName = @options.eventBasename
      @dragging = false
      @basepoint_set = false
      @button_activated = false
      @tool_active = false
      @touch = 'ontouchstart' of document.documentElement
      @frame_view = ""

    bind_bokeh_events: (plotview, eventSink) ->
      if @options.touch_event? && not @options.touch_event
        return null
      if @options.button_disable? and @options.button_disable
        button_disabled = "disabled"
      if @frame_view == ""
        @frame_view = plotview.view_state.get('frame')
      if not plotview.view_state.get('resize_plot') and @options.buttonText.toLowerCase() is 'resize'
        return null
      toolName = @toolName
      @plotview = plotview
      @eventSink = eventSink
      @plotview.canvas_wrapper.bind("mousewheel",
        (e, delta, dX, dY) =>
          if @tool_active or (not @eventSink.active and e.shiftKey)
            set_bokehXY(e)
            e.delta = delta
            eventSink.trigger("#{toolName}:zoom", e)
            e.preventDefault()
            e.stopPropagation()
      )

      $(document).bind('keydown', (e) =>
        #disable the tool when ESC is pressed
        if e.keyCode == 27
          eventSink.trigger("clear_active_tool"))

      @plotview.canvas_wrapper.bind 'click', (e) =>
        if @frame_view == "onfocus"
          @plotview.canvas_header.removeClass('hide')
          @plotview.canvas_footer.removeClass('hide')
          @plotview.$el.find('.plotarea').addClass('frame')

      endClick = if @touch then 'touchend' else 'mouseup'
      
      $(document).bind(endClick, (e) =>
        if !e.target.className.match(/gear-icon/)
          @plotview.$el.find('.popup_menu').removeClass('show_popup')
        else
          @plotview._close_modal_window())

      @plotview.frame_close.bind(endClick, (e) =>
        if @frame_view == "on"
          @frame_view = "off"
        @plotview.canvas_header.addClass('hide')
        @plotview.canvas_footer.addClass('hide')
        @plotview._close_modal_window()
        @plotview.$el.find('.plotarea').removeClass('frame'))

      # @mouseover_count = 0
      #waiting 500 ms and testing mouseover countmakes sure that
      # #mouseouts that occur because of going over element borders don't
      # #trigger the mouseout
      # @plotview.$el.bind("mouseout", (e) =>
      #   @mouseover_count -=1
      #   _.delay((=>
      #     if @mouseover_count == 0
      #       eventSink.trigger("clear_active_tool")), 500))

      @plotview.$el.bind("mousein", (e) =>
        eventSink.trigger("clear_active_tool"))

      @plotview.$el.bind("mouseover", (e) =>
        @mouseover_count += 1)

      if @plotview.view_state.get('resize_plot') and @options.buttonText.toLowerCase() is 'resize'
        if @touch
          @$tool_button = $("<i class='resize-icon icon-fullscreen'></i>")
          @plotview.$el.find('.button_icon').append(@$tool_button)
        else
          @$tool_button = $("<div class='resize_bokeh_plot'></div>")
          @plotview.canvas_wrapper.append(@$tool_button)
      else
        @$tool_button = $("<button class='btn btn-small' #{button_disabled}> #{@options.buttonText} </button>")
        @plotview.$el.find('.button_bar').append(@$tool_button)

      if @plotview.view_state.get('resize_plot') and @options.buttonText.toLowerCase() is 'resize' and not @touch
        @$tool_button.mousedown(=>
          if not @button_activated
            eventSink.trigger("active_tool", toolName))
        $(document).bind('mouseup', (e) =>
          if @$tool_button[0].className.match(/resize_bokeh_plot/)
            if @button_activated
              eventSink.trigger("clear_active_tool"))
        @$tool_button.mouseup(=>
          if @button_activated
            eventSink.trigger("clear_active_tool"))
      else
        @$tool_button.click(=>
          if @button_activated
            eventSink.trigger("clear_active_tool")
          else
            eventSink.trigger("active_tool", toolName)
            @button_activated = true)

      no_scroll = (el) ->
        el.setAttribute("old_overflow", el.style.overflow)
        el.style.overflow = "hidden"
        if el == document.body
          return
        else
          no_scroll(el.parentNode)
      restore_scroll = (el) ->
        el.style.overflow = el.getAttribute("old_overflow")
        if el == document.body
          return
        else
          restore_scroll(el.parentNode)

      eventSink.on("#{toolName}:deactivated", =>
        @tool_active=false;
        @button_activated = false;
        @$tool_button.removeClass('active')
        document.body.style.overflow = @old_overflow)

      eventSink.on("#{toolName}:activated", =>
        @tool_active=true;
        @$tool_button.addClass('active'))

      return eventSink
    hide_button: ->
      @$tool_button.hide()

  class ButtonEventGenerator

    constructor: (options) ->
      @options = options
      @toolName = @options.eventBasename
      @button_activated = false
      @tool_active = false
      @touch = 'ontouchstart' of document.documentElement
      @frame_view = ""

    bind_bokeh_events: (plotview, eventSink) ->
      if @options.touch_event? && not @options.touch_event
        return null
      if @options.button_disable? and @options.button_disable
        button_disabled = "disabled"
      if @frame_view == ""
        @frame_view = plotview.view_state.get('frame')
      if not plotview.view_state.get('resize_plot') and @options.buttonText.toLowerCase() is 'resize'
        return null
      toolName = @toolName
      @plotview = plotview
      @eventSink = eventSink

      $(document).bind('keydown', (e) =>
        #disable the tool when ESC is pressed
        if e.keyCode == 27
          eventSink.trigger("clear_active_tool"))

      @plotview.canvas_wrapper.bind 'click', (e) =>
        if @frame_view == "onfocus"
          @plotview.canvas_header.removeClass('hide')
          @plotview.canvas_footer.removeClass('hide')
          @plotview.$el.find('.plotarea').addClass('frame')

      endClick = if @touch then 'touchend' else 'mouseup'
      
      $(document).bind(endClick, (e) =>
        if !e.target.className.match(/gear-icon/)
          @plotview.$el.find('.popup_menu').removeClass('show_popup')
        else
          @plotview._close_modal_window())

      @plotview.frame_close.bind(endClick, (e) =>
        if @frame_view == "on"
          @frame_view = "off"
        @plotview.canvas_header.addClass('hide')
        @plotview.canvas_footer.addClass('hide')
        @plotview._close_modal_window()
        @plotview.$el.find('.plotarea').removeClass('frame'))

      # @mouseover_count = 0
      # #waiting 500 ms and testing mouseover countmakes sure that
      # #mouseouts that occur because of going over element borders don't
      # #trigger the mouseout
      # @plotview.$el.bind("mouseout", (e) =>
      #   @mouseover_count -=1
      #   _.delay((=>
      #     if @mouseover_count == 0
      #       eventSink.trigger("clear_active_tool")), 500))

      @plotview.$el.bind("mouseover", (e) =>
        @mouseover_count += 1)

      if @plotview.view_state.get('resize_plot') and @options.buttonText.toLowerCase() is 'resize'
        if @touch
          @$tool_button = $("<i class='resize-icon icon-fullscreen'></i>")
          @plotview.$el.find('.button_icon').append(@$tool_button)
        else
          @$tool_button = $("<div class='resize_bokeh_plot'></div>")
          @plotview.canvas_wrapper.append(@$tool_button)
      else
        @$tool_button = $("<button class='btn btn-small' #{button_disabled}> #{@options.buttonText} </button>")
        @plotview.$el.find('.button_bar').append(@$tool_button)

      if @plotview.view_state.get('resize_plot') and @options.buttonText.toLowerCase() is 'resize' and not @touch
        @$tool_button.mousedown(=>
          if not @button_activated
            eventSink.trigger("active_tool", toolName))
        $(document).bind('mouseup', (e) =>
          if @$tool_button[0].className.match(/resize_bokeh_plot/)
            if @button_activated
              eventSink.trigger("clear_active_tool"))
        @$tool_button.mouseup(=>
          if @button_activated
            eventSink.trigger("clear_active_tool"))
      else
        @$tool_button.click(=>
          if @button_activated
            eventSink.trigger("clear_active_tool")
          else
            eventSink.trigger("active_tool", toolName)
            @button_activated = true)

      no_scroll = (el) ->
        el.setAttribute("old_overflow", el.style.overflow)
        el.style.overflow = "hidden"
        if el == document.body
          return
        else
          no_scroll(el.parentNode)
      restore_scroll = (el) ->
        el.style.overflow = el.getAttribute("old_overflow")
        if el == document.body
          return
        else
          restore_scroll(el.parentNode)

      eventSink.on("#{toolName}:deactivated", =>
        @tool_active=false;
        @button_activated = false;
        @$tool_button.removeClass('active')
        document.body.style.overflow = @old_overflow)

      eventSink.on("#{toolName}:activated", =>
        @tool_active=true;
        @$tool_button.addClass('active'))

      return eventSink
    hide_button: ->
      @$tool_button.hide()

  return {
    "TwoPointEventGenerator": TwoPointEventGenerator,
    "OnePointWheelEventGenerator": OnePointWheelEventGenerator,
    "ButtonEventGenerator": ButtonEventGenerator,
    "isTouch": 'ontouchstart' of document.documentElement,
  }
