_ = require "underscore"
HasProperties = require "./has_properties"
{logger} = require "./logging"
Selector = require "./selector"
hittest = require "./hittest"

class SelectionManager extends HasProperties
  type: 'SelectionManager'

  initialize: (attrs, options) ->
    super(attrs, options)
    @selectors = {}

  set_selection: (indices) ->
    @_save_indices(indices)
    source = @get('source')
    source.trigger('select')

  select: (tool, renderer_view, geometry, final, append=false) ->
    source = @get('source')
    if source != renderer_view.mget('data_source')
      logger.warn('select called with mis-matched data sources')

    indices = renderer_view.hit_test(geometry)

    # if selection type is supported on the specific renderer
    if !!indices
      selector = @_get_selector(renderer_view)
      selector.update(indices, final, append)

      @_save_indices(selector.get('indices'))
      source.trigger('select')
      source.trigger('select-' + renderer_view.mget('id'))

  inspect: (tool, renderer_view, geometry, data) ->
    source = @get('source')
    if source != renderer_view.mget('data_source')
      logger.warn('inspect called with mis-matched data sources')

    indices = renderer_view.hit_test(geometry)

    if indices?
      source.trigger(
        'inspect', indices, tool, renderer_view, source, data
      )
      source.trigger(
        "inspect#{renderer_view.mget('id')}", indices, tool, renderer_view,
        source, data
      )

  clear: (rview) ->
    if rview?
      selector = @_get_selector(rview)
      selector.clear()
    else
      for k, s of @selectors
        s.clear()
    @_save_indices(hittest.create_hit_test_result())

  _get_selector: (rview) ->
    _.setdefault(@selectors, rview.model.id, new Selector())
    return @selectors[rview.model.id]

  _save_indices: (indices) ->
    @get('source').save({
      "selected": indices
    }, {patch: true})

module.exports = SelectionManager
