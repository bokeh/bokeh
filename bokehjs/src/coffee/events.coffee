
class Event

  @_event_classes = {}

  constructor : (options) ->
    @_options = options

  @event_class : (e) ->
    # Given an event with a type attribute matching the event_name,
    # return the appropriate Event class
    if not e.type?
        console.warn('Event.event_class required events with a string type attribute')
    return @_event_classes[e.type]

  toJSON : () ->
    if not this.constructor.event_name
        throw Error('All events need to have an event name.')
    return {event_name: this.constructor.event_name, event_values: @_options}

  # Called by one of the applicable models processing the event
  _customize_event : (model) ->
    return @


class UIEvent extends Event
  # A UIEvent is an event originating on a PlotCanvas this includes
  # DOM events such as keystrokes as well as hammer events.
  @applicable_models = ['Plot']


export class KeyDown extends UIEvent
  @event_name = 'keydown'
  @_event_classes['keydown'] = @

  constructor: (options) ->
    @key = options.key
    super(options)

export class HammerEvent extends UIEvent

  constructor: (options) ->
    {@sx, @sy} = options
    [@x, @y] = [null, null]
    # Class attributes don't appear on instances?
    super(options)

  @from_event : (e) ->
    # Given a hammer event, construct a corresponding Event instance
    return new @({sx: e.bokeh['sx'], sy : e.bokeh['sy']})

  _customize_event : (plot) ->
    xmapper = plot.plot_canvas.frame.x_mappers['default']
    ymapper = plot.plot_canvas.frame.y_mappers['default']
    @x = xmapper.map_from_target(@sx)
    @y = ymapper.map_from_target(@sy)
    @_options['x'] = @x
    @_options['y'] = @y
    return @
