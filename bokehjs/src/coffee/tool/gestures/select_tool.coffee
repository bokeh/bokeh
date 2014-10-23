
define [
  "common/logging"
  "./gesture_tool"
], (Logging, GestureTool) ->

  logger = Logging.logger

  class SelectToolView extends GestureTool.View

    _keyup: (e) ->
      if e.keyCode == 27
        for r in @mget('renderers')
          ds = r.get('data_source')
          sm = ds.get('selection_manager')
          sm.clear()

  class SelectTool extends GestureTool.Model

    initialize: (attrs, options) ->
      super(attrs, options)

      names = @get('names')
      renderers = @get('renderers')

      if renderers.length == 0
        all_renderers = @get('plot').get('renderers')
        renderers = (r for r in all_renderers when r.type == "GlyphRenderer")

      if names.length > 0
        renderers = (r for r in renderers when names.indexOf(r.get('name')) >= 0)

      @set('renderers', renderers)
      logger.debug("setting #{renderers.length} renderers for #{@type} #{@id}")
      for r in renderers
        logger.debug("- #{r.type} #{r.id}")

    defaults: () ->
      return _.extend({}, super(), {
        renderers: []
        names: []
        multi_select_modifier: "shift"
      })

  return {
    "Model": SelectTool
    "View": SelectToolView
  }
