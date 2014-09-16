define [
  "common/continuum_view"
  "backbone",
  "common/has_parent",
], (ContinuumView, Backbone, HasParent) ->

  class LogView extends ContinuumView
    attributes:
      class: "LogView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")

  class Log extends HasParent
    type : "Log"
    default_view: LogView

  class Logs extends Backbone.Collection
    model : Log

  return {
    "Model" : Log
    "Collection" : new Logs()
  }
