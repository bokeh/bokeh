_ = require "underscore"
HasProps = require "../core/has_props"
hittest = require "./hittest"
{logger} = require "../core/logging"

class Selector extends HasProps
  type: 'Selector'

  update: (indices, final, append, silent=false) ->
    @set('timestamp', new Date(), {silent: silent})
    @set('final', final, {silent: silent})
    if append
      if @get('indices').get_model()
        indices.get_model = @get('indices').get_model
        indices.get_view = @get('indices').get_view
      indices['1d'].indices =  _.union(@get('indices')['1d'].indices, indices['1d'].indices)
      indices['2d'].indices =  _.union(@get('indices')['2d'].indices, indices['2d'].indices)
    @set('indices', indices, {silent: silent})

  clear: () ->
    @set('timestamp', new Date())
    @set('final', true)
    @set('indices', hittest.create_hit_test_result())

  defaults: ->
    return _.extend {}, super(), {
      indices: hittest.create_hit_test_result()
    }

module.exports = Selector
