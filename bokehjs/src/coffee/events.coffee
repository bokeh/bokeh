
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
