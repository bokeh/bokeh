_ = require "underscore"
Logging = require "../common/logging"

logger = Logging.logger

show = (target, plot) ->

  logger.debug("Scheduling render for plot #{plot} on target #{target}")

  myrender = () ->
    view = new plot.default_view(model: plot)
    target.append(view.$el)
  _.defer(myrender)

module.exports =
  show: show
