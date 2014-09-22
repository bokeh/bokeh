
define [
  "underscore"
  "./has_properties"
  "./logging"
  "./selector"
], (_, HasProperties, Logging, Selector) ->

  logger = Logging.logger

  class SelectionManager extends HasProperties
    type: 'SelectionManager'

    initialize: (attrs, options) ->
      super(attrs, options)
      @selectors = {}

    select: (tool, renderer_view, geometry, final, append=false) ->
      source = @get('source')
      if source != renderer_view.mget('data_source')
        logger.warn('select called with mis-matched data sources')

      indices = renderer_view.hit_test(geometry)

      selector = @_get_selector(tool)
      selector.update(indices, geometry, final, append)

      @_save(selector)
      source.trigger('select')

    inspect: (tool, renderer_view, geometry, data) ->
      source = @get('source')
      if source != renderer_view.mget('data_source')
        logger.warn('inspect called with mis-matched data sources')

      indices = renderer_view.hit_test(geometry)

      if indices?
        source.trigger(
          'inspect', indices, tool, renderer_view, source, data
        )

    clear: (tool) ->
      selector = @_get_selector(tool)
      selector.clear()
      @_save(selector)

    _get_selector: (tool) ->
      _.setdefault(@selectors, tool.model.id, new Selector())
      return @selectors[tool.model.id]

    _save: (selector) ->
      @get('source').save({
        "selector": selector
        "selection": selector.get('indices')
      }, {patch: true})
