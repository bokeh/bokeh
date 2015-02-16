
define [
  "underscore"
  "common/logging"
], (_, Logging) ->

  logger = Logging.logger

  show = (target, plot) ->

    logger.debug("Scheduling render for plot #{plot} on target #{target}")

    myrender = () ->
      view = new plot.default_view(model: plot)
      target.append(view.$el)
    _.defer(myrender)

  return {
    show: show
  }
