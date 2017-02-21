import {HasProps} from "./core/has_props"
import * as p from "./core/properties"
import {isString} from "./core/util/types"

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

  _update_event_callbacks : () ->
    if not @document?
      # File an issue: SidePanel in particular seems to have this issue
      console.warn('WARNING: Document not defined for updating event callbacks')
      return
    @document.event_manager.subscribed_models.push(@)

  _doc_attached : () ->
    if Object.keys(@js_event_callbacks).length != 0
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
