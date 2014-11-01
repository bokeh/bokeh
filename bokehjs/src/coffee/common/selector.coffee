
define [
  "underscore"
  "./has_properties"
  "./logging"
], (_, HasProperties, Logging) ->

  logger = Logging.logger

  class Selector extends HasProperties
    type: 'Selector'

    update: (indices, final, append) ->
      @set('timestamp', new Date())
      @set('final', final)
      if append
        indices = _.union(@get('indices'), indices)
      @set('indices', indices)

    clear: () ->
      @set('timestamp', new Date())
      @set('final', true)
      @set('indices', [])

    defaults: ->
      return _.extend {}, super(), {
        indices: []
      }