_ = require "underscore"
HasProperties = require "./has_properties"
{logger} = require "./logging"

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

module.exports = Selector
