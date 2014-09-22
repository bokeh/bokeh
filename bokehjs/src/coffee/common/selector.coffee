
define [
  "underscore"
  "./has_properties"
  "./logging"
], (_, HasProperties, Logging) ->

  logger = Logging.logger

  class Selector extends HasProperties
    type: 'Selector'

    update: (indices, geometry, final, append) ->
      @set('timestamp', new Date())
      @set('geometry', geometry)
      @set('final', final)
      if append
        indices = _.union(@get('indices'), indices)
      @set('indices', indices)