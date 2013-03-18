
class TwoPointEventGenerator

  constructor : (options) ->
    @options = options
    @toolName = @options.eventBasename
    @dragging = false
    @basepoint_set = false
    @button_activated = false
    @tool_active = false

  bind_events : (plotview, eventSink) ->
    toolName = @toolName
    @plotview = plotview
    @eventSink = eventSink
    @plotview.moveCallbacks.push((e, x, y) =>
      if not @dragging
        return
      if not @tool_active
        return
      offset = $(e.currentTarget).offset()
      e.bokehX = e.pageX - offset.left
      e.bokehY = e.pageY - offset.top
    
      if not @basepoint_set
        @dragging = true
        @basepoint_set = true
        eventSink.trigger("#{toolName}:SetBasepoint", e)
      else
        eventSink.trigger("#{toolName}:UpdatingMouseMove", e)
        e.preventDefault()
        e.stopPropagation()
      )

    $(document).bind('keydown', (e) =>
      if e[@options.keyName]
        @_start_drag()
      #disable the tool when ESC is pressed
      if e.keyCode == 27
        eventSink.trigger("clear_active_tool"))

    $(document).bind('keyup', (e) =>
      if not e[@options.keyName]
        @_stop_drag(e))

    @plotview.main_can_wrapper.bind('mousedown', (e) =>
      if @button_activated
        @_start_drag()
        return false)

    @plotview.main_can_wrapper.bind('mouseup', (e) =>
      if @button_activated
        @_stop_drag(e)
        return false)

    @$tool_button = $("<button class='btn btn-small'> #{@options.buttonText} </button>")
    @plotview.$el.find('.button_bar').append(@$tool_button)

    @$tool_button.click(=>
      if @button_activated
        eventSink.trigger("clear_active_tool")
      else
        eventSink.trigger("active_tool", toolName)
        @button_activated = true)

    eventSink.on("#{toolName}:deactivated", =>
      @tool_active=false;
      @button_activated = false;
      @$tool_button.removeClass('active'))

    eventSink.on("#{toolName}:activated", =>
      @tool_active=true;
      @$tool_button.addClass('active'))
    return eventSink

  _start_drag : ->
    @eventSink.trigger("active_tool", @toolName)
    if not @dragging
      @dragging = true
      if not @button_activated
        @$tool_button.addClass('active')

  _stop_drag : (e)->
    @basepoint_set = false
    if @dragging
      @dragging = false
      if not @button_activated
        @$tool_button.removeClass('active')
      offset = $(e.currentTarget).offset()
      e.bokehX = e.pageX - offset.left
      e.bokehY = e.pageY - offset.top
      @eventSink.trigger("#{@options.eventBasename}:DragEnd", e)



class OnePointWheelEventGenerator

  constructor : (options) ->
    @options = options
    @toolName = @options.eventBasename
    @dragging = false
    @basepoint_set = false
    @button_activated = false
    @tool_active = false

  bind_events : (plotview, eventSink) ->
    toolName = @toolName
    @plotview = plotview
    @eventSink = eventSink
    @plotview.main_can_wrapper.bind("mousewheel",
      (e, delta, dX, dY) =>
        if not @tool_active
          return
        offset = $(e.currentTarget).offset()
        e.bokehX = e.pageX - offset.left
        e.bokehY = e.pageY - offset.top
        e.delta = delta
        eventSink.trigger("#{toolName}:zoom", e)
        e.preventDefault()
        e.stopPropagation())

    $(document).bind('keydown', (e) =>
      #disable the tool when ESC is pressed
      if e.keyCode == 27
        eventSink.trigger("clear_active_tool"))

    @mouseover_count = 0
    #waiting 500 ms and testing mouseover countmakes sure that
    #mouseouts that occur because of going over element borders don't
    #trigger the mouseout
    @plotview.$el.bind("mouseout", (e) =>
      @mouseover_count -=1
      _.delay((=>
        if @mouseover_count == 0
          eventSink.trigger("clear_active_tool")), 500))

    @plotview.$el.bind("mouseover", (e) =>
      @mouseover_count += 1)

    @$tool_button = $("<button class='btn btn-small'> #{@options.buttonText} </button>")
    @plotview.$el.find('.button_bar').append(@$tool_button)

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
      restore_scroll(@plotview.$el[0])
      document.body.style.overflow = @old_overflow)

    eventSink.on("#{toolName}:activated", =>
      @tool_active=true;
      @$tool_button.addClass('active')
      no_scroll(@plotview.$el[0]))

    return eventSink

exports.TwoPointEventGenerator = TwoPointEventGenerator
exports.OnePointWheelEventGenerator = OnePointWheelEventGenerator