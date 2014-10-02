
define [
  "./action_tool"
], (ActionTool) ->

  class SelectToolView extends ActionTool.View

    _keyup: (e) ->
      if e.keyCode == 27
        for r in @mget('renderers')
          ds = r.get('data_source')
          sm = ds.get('selection_manager')
          sm.clear()

  class SelectTool extends ActionTool.Model

    initialize: (attrs, options) ->
      super(attrs, options)

      names = @get('names')
      renderers = @get('renderers')

      if renderers.length == 0
        all_renderers = @get('plot').get('renderers')
        renderers = (r for r in all_renderers when r.type == "Glyph")

      if names.length > 0
        renderers = (r for r in renderers when names.indexOf(r.get('name')) >= 0)

      @set('renderers', renderers)

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
