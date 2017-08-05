import {Signal, Signalable} from "./signaling"
import {uniqueId} from "./util/string"

export class View
  @prototype extends Signalable

  @getters = (specs) ->
    for name, fn of specs
      Object.defineProperty(@prototype, name, { get: fn })

  constructor: (options={}) ->
    @removed = new Signal(this, "removed")

    if options.model?
      @model = options.model
    else
      throw new Error("model of a view wasn't configured")

    @_parent = options.parent

    @id = options.id ? uniqueId()
    @initialize(options)

  initialize: (options) ->

  remove: () ->
    @_parent = undefined
    @disconnect_signals()
    @removed.emit()

  toString: () -> "#{@model.type}View(#{@id})"

  @getters {
    parent: () ->
      if @_parent != undefined
        return @_parent
      else
        throw new Error("parent of a view wasn't configured")
    is_root: () ->
      return @parent == null
    root: () ->
      return if @is_root then this else @parent.root
  }

  connect_signals: () ->

  disconnect_signals: () ->
    Signal.disconnectReceiver(@)
