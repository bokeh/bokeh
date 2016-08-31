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
      new_indices = hittest.create_hit_test_result()
      new_indices['0d'].indices =  _.union(@get('indices')['0d'].indices, indices['0d'].indices)
      new_indices['0d'].glyph =  @get('indices')['0d'].glyph or indices['0d'].glyph
      new_indices['1d'].indices =  _.union(@get('indices')['1d'].indices, indices['1d'].indices)
      new_indices['2d'] = @get('indices')['2d']
      for [k, v] in _.pairs(indices['2d'])
        if _.has(new_indices['2d'], k)
          new_indices['2d'][k] = _.uniq(new_indices['2d'][k].concat(v).sort(), true)
        else
          new_indices['2d'][k] = v
    else
      new_indices = indices
    @set('indices', new_indices, {silent: silent})

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
