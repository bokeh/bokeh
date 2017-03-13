import {HasProps} from "./core/has_props"
import * as p from "./core/properties"
import {isString} from "./core/util/types"
import {isEmpty} from "./core/util/object"
import {logger} from "./core/logging"

export class Model extends HasProps
  type: "Model"

  @define {
    tags:               [ p.Array, [] ]
    name:               [ p.String    ]
    js_callbacks:       [ p.Any,   {} ]
    js_event_callbacks: [ p.Any,   {} ]
    subscribed_events:  [ p.Array, [] ]
  }

  initialize: (options) ->
    super(options)
    for evt, callbacks of @js_callbacks
      for cb in callbacks
        @listenTo(@, evt, () -> cb.execute(@))

    @listenTo(@, 'change:js_event_callbacks', () -> @_update_event_callbacks)


  _process_event : (event) ->
    # Given an applicable event, execute the associated callback
    if not event.constructor.event_name
       logger.warn('Event is still passed as a string: ' + event)
       return

    if not event.constructor.applicable_models.some((m) => @ instanceof m )
      return

    event = event._customize_event(@)
    event_name = event.constructor.event_name
    js_event_callbacks = @js_event_callbacks[event_name]
    js_event_callbacks = if js_event_callbacks then js_event_callbacks else []
    for callback in js_event_callbacks
      callback.execute({event: event},{})

    if @subscribed_events.some((m) -> m == event_name)
      @document.event_manager.send_event(event)

  trigger_event : (event) ->
    if @document?
      @document.event_manager.trigger(event.set_model_id(@.id))

  _update_event_callbacks : () ->
    if not @document?
      # File an issue: SidePanel in particular seems to have this issue
      logger.warn('WARNING: Document not defined for updating event callbacks')
      return
    @document.event_manager.subscribed_models.push(@.id)

  _doc_attached : () ->
    if not isEmpty(@js_event_callbacks)
      @_update_event_callbacks()

  select: (selector) ->
    if selector.prototype instanceof Model
      @references().filter((ref) -> ref instanceof selector)
    else if isString(selector)
      @references().filter((ref) -> ref.name == selector)
    else
      throw new Error("invalid selector")

  select_one: (selector) ->
    result = @select(selector)
    switch result.length
      when 0
        null
      when 1
        result[0]
      else
        throw new Error("found more than one object matching given selector")
