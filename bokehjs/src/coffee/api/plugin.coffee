
define [
  "underscore"
  "jquery"
  "common/logging"
  "./figure"
  "./helpers"
], (_, $, Logging, figure, helpers) ->

  logger = Logging.logger
  show = helpers.show

  _api = {
    "figure": figure
  }

  $.fn.bokeh = (type, args) ->

    if type not of _api
      logger.error("Unknown API type '#{type}'. Recognized API types: #{Object.keys(_api)}")
      return this

    obj = _api[type](args)

    show(this, obj)

    return obj
