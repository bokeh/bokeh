
define [
  "underscore"
  "jquery"
  "./logging"
  "./plot"
], (_, $, Logging, Plot) ->

  logger = Logging.logger

  class Figure extends Plot.Model
    default_view: Plot.PlotView

    initialize: (attrs, options) ->
      super(attrs, options)

    defaults: ->
      return _.extend {}, super(), {
        title: 'plot'
      }

    display_defaults: ->
      return _.extend {}, super(), {
        border_fill: "#fff",
      }