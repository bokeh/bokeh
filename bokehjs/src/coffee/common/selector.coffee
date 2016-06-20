_ = require "underscore"
HasProps = require "../core/has_props"
hittest = require "./hittest"
{logger} = require "../core/logging"
p = require "../core/properties"

class Selector extends HasProps
  type: 'Selector'

  update: (indices, final, append, silent=false) ->
    @set('timestamp', new Date(), {silent: silent})
    @set('final', final, {silent: silent})
    if append
      indices['0d'].indices =  _.union(@get('indices')['0d'].indices, indices['0d'].indices)
      indices['0d'].glyph =  @get('indices')['0d'].glyph or indices['0d'].glyph
      indices['1d'].indices =  _.union(@get('indices')['1d'].indices, indices['1d'].indices)
      indices['2d'].indices =  _.union(@get('indices')['2d'].indices, indices['2d'].indices)
    @set('indices', indices, {silent: silent})

  clear: () ->
    @set('timestamp', new Date())
    @set('final', true)
    @set('indices', hittest.create_hit_test_result())

  @internal {
    indices:   [ p.Any, () -> hittest.create_hit_test_result() ]
    final:     [ p.Boolean ]
    timestamp: [ p.Any ]
  }

module.exports = Selector
