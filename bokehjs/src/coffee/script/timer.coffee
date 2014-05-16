define [
  "underscore"
  "backbone"
  "common/has_properties"
  "common/continuum_view"
  "common/base"
], (_, Backbone, HasProperties, continuum_view, base) ->

  class TimerView extends continuum_view.View

    initialize : (options) ->
      super(options)
      @timer_id = null
      @create_timer()
      @render()
      @listenTo(@model, 'change', () => @create_timer)

    render: () ->
      @$el.empty()

    create_timer: () ->
      @destroy_timer()
      require ["main"], (Bokeh) =>
        @timer_id = setInterval(eval(@mget("callback")), @mget("interval"))

    destroy_timer: () ->
      if @timer_id?
        clearInterval(@timer_id)
        @timer_id = null

  class Timer extends HasProperties
    type: 'Timer'
    default_view: TimerView
    defaults: () ->
      _.extend({}, super(), {interval: 1000, callback: "function() {}"})

  class Timers extends Backbone.Collection
    model: Timer

  return {
    View: TimerView,
    Model: Timer,
    Collection: new Timers()
  }

