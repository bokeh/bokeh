_ = require "underscore"
HasProperties = require "./has_properties"
hittest = require "./hittest"
{logger} = require "./logging"

class Selector extends HasProperties
  type: 'Selector'

  update: (indices, final, append) ->
    @set('timestamp', new Date())
    @set('final', final)
    if append
      indices['0d'].indices =  _.union(@get('indices')['0d'].indices, indices['0d'].indices)
      indices['0d'].flag =  @get('indices')['0d'].flag or indices['0d'].flag
      indices['1d'].indices =  _.union(@get('indices')['1d'].indices, indices['1d'].indices)
      indices['2d'].indices =  _.union(@get('indices')['2d'].indices, indices['2d'].indices)
    @set('indices', indices)

  clear: () ->
    @set('timestamp', new Date())
    @set('final', true)
    @set('indices', hittest.create_hit_test_result())

  defaults: ->
    return _.extend {}, super(), {
      indices: hittest.create_hit_test_result()
    }

module.exports = Selector
