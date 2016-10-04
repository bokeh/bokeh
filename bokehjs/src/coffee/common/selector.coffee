_ = require "underscore"
HasProps = require "../core/has_props"
hittest = require "./hittest"
{logger} = require "../core/logging"
p = require "../core/properties"

class Selector extends HasProps
  type: 'Selector'

  select: (tool, renderer_view, geometry, final=true) ->
    if @source != renderer_view.model.data_source
      logger.warn('select called with mis-matched data sources')

    indices = renderer_view.hit_test(geometry)

    if indices?
      selected = @_update(indices, true, final) # append = true
      # Here for compatibility, should be removed
      @source.selected = selected

      @source.trigger('select')
      @source.trigger("select-#{renderer_view.model.id}")

      return not indices.is_empty()
    else
      return false

  inspect: (tool, renderer_view, geometry, final=true) ->
    if @source != renderer_view.model.data_source
      logger.warn('inspect called with mis-matched data sources')

    indices = renderer_view.hit_test(geometry)

    if indices?
      inspected = @_update(indices, false, final, true) # append = false
      # Here for compatibility, should be removed
      @source.inspected = inspected

      @source.trigger(
        'inspect', indices, tool, renderer_view, @source, {'geometry': geometry}
      )
      @source.trigger(
        "inspect#{renderer_view.model.id}", indices, tool, renderer_view,
        @source, {'geometry': geometry}
      )

      return not indices.is_empty()
    else
      return false

  _update: (indices, append, final, silent=false) ->
    @setv('timestamp', new Date(), {silent: silent})
    @setv('final', final, {silent: silent})
    if append
      new_indices = hittest.create_hit_test_result()
      new_indices['0d'].indices =  _.union(@indices['0d'].indices, indices['0d'].indices)
      new_indices['0d'].glyph =  @indices['0d'].glyph or indices['0d'].glyph
      new_indices['1d'].indices =  _.union(@indices['1d'].indices, indices['1d'].indices)
      new_indices['2d'] = @indices['2d']
      for [k, v] in _.pairs(indices['2d'])
        if _.has(new_indices['2d'], k)
          new_indices['2d'][k] = _.uniq(new_indices['2d'][k].concat(v).sort(), true)
        else
          new_indices['2d'][k] = v
    else
      new_indices = indices
    @setv('indices', new_indices, {silent: silent})
    return new_indices

  clear: () ->
    @timestamp = new Date()
    @final = true
    @indices = hittest.create_hit_test_result()
    @source.selected = @indices

  @internal {
    indices:   [ p.Any, () -> hittest.create_hit_test_result() ]
    timestamp: [ p.Any      ]
    source:    [ p.Instance ]
    final:     [ p.Boolean  ]
  }

module.exports = Selector
