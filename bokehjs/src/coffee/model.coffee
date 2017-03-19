import {HasProps} from "./core/has_props"
import * as p from "./core/properties"
import {isString} from "./core/util/types"
import {isEmpty} from "./core/util/object"
import {logger} from "./core/logging"

export class Model extends HasProps
  type: "Model"

  @define {
    tags:                  [ p.Array, [] ]
    name:                  [ p.String    ]
    js_property_callbacks: [ p.Any,   {} ]
    js_event_callbacks:    [ p.Any,   {} ]
    subscribed_events:     [ p.Array, [] ]
  }

  initialize: (options) ->
    super(options)
    for evt, callbacks of @js_property_callbacks
      for cb in callbacks
        @listenTo(@, evt, () -> cb.execute(@))

    @listenTo(@, 'change:js_event_callbacks', () -> @_update_event_callbacks)

  _process_event: (event) ->
    if event.is_applicable_to(this)
      event = event._customize_event(@)

      for callback in @js_event_callbacks[event.event_name] ? []
        callback.execute({event: event}, {})

      if @subscribed_events.some((m) -> m == event.event_name)
        @document.event_manager.send_event(event)

  trigger_event: (event) ->
    if @document?
      @document.event_manager.trigger(event.set_model_id(@.id))

  _update_event_callbacks: () ->
    if not @document?
      # File an issue: SidePanel in particular seems to have this issue
      logger.warn('WARNING: Document not defined for updating event callbacks')
      return
    @document.event_manager.subscribed_models.push(@id)

  _doc_attached: () ->
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
