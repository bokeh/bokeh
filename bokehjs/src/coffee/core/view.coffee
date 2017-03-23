import {Events} from "./events"
import {uniqueId} from "./util/string"

export class View
  @prototype extends Events

  @getters = (specs) ->
    for name, fn of specs
      Object.defineProperty(@prototype, name, { get: fn })

  constructor: (options={}) ->
    if options.model?
      @model = options.model
    else
      throw new Error("model of a view wasn't configured")

    if options.parent != undefined # null means root
      @parent = options.parent
    else
      throw new Error("parent of a view wasn't configured")

    @id = options.id ? uniqueId('View')
    @initialize(options)

  initialize: (options) ->

  remove: () ->
    @parent = undefined
    @stopListening()
    @trigger('remove')

  toString: () -> "#{@model.type}View(#{@id})"

  @getters {
    is_root: () -> @parent == null
  }

  bind_bokeh_events: () ->
