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
    @inspectors = {}

  serializable_in_document: () -> false

  set_selection: (indices) ->
    @_save_indices(indices)
    source = @get('source')
    source.trigger('select')

  select: (tool, renderer_view, geometry, final, append=false) ->
    source = @get('source')
    if source != renderer_view.mget('data_source')
      logger.warn('select called with mis-matched data sources')

    indices = renderer_view.hit_test(geometry)

    if indices?
      selector = @_get_selector(renderer_view)
      selector.update(indices, final, append)

      @get('source').set({ "selected": selector.get('indices') })

      source.trigger('select')
      source.trigger('select-' + renderer_view.mget('id'))

  inspect: (tool, renderer_view, geometry, data) ->
    source = @get('source')
    if source != renderer_view.mget('data_source')
      logger.warn('inspect called with mis-matched data sources')

    indices = renderer_view.hit_test(geometry)

    if indices?
      inspector = @_get_inspector(renderer_view)
      inspector.update(indices, true, false, true)

      @get('source').set({ "inspected": inspector.get('indices')}, {"silent": true })

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

  _get_inspector: (rview) ->
    _.setdefault(@inspectors, rview.model.id, new Selector())
    return @inspectors[rview.model.id]


module.exports = SelectionManager
