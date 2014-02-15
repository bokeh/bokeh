
define [
  "underscore",
  "backbone",
  "./tool",
], (_, Backbone, Tool) ->

  class HoverToolView extends Tool.View
    initialize: (options) ->
      super(options)

    bind_bokeh_events: () ->
      @plot_view.canvas.bind("mousemove", (e) =>
        offset = $(e.currentTarget).offset()
        left = if offset? then offset.left else 0
        top = if offset? then offset.top else 0
        e.bokehX = e.pageX - left
        e.bokehY = e.pageY - top
        [vx, vy] = @view_coords(e.bokehX, e.bokehY)
        @_select(vx, vy)
      )
      ""

    pause:()->
      return null

    view_coords: (sx, sy) ->
      [vx, vy] = [
        @plot_view.view_state.sx_to_vx(sx),
        @plot_view.view_state.sy_to_vy(sy)
      ]
      return [vx, vy]

    _select: (vx, vy) ->
      geometry = {
        type: 'point'
        vx: vx
        vy: vy
      }

      datasources = {}
      datasource_selections = {}
      for renderer in @mget_obj('renderers')
        datasource = renderer.get_obj('data_source')
        datasources[datasource.id] = datasource

      for renderer in @mget_obj('renderers')
        datasource_id = renderer.get_obj('data_source').id
        _.setdefault(datasource_selections, datasource_id, [])
        selected = @plot_view.renderers[renderer.id].hit_test(geometry)
        if selected.length > 0
          console.log "HIT", selected
        datasource_selections[datasource_id].push(selected)

      return null

  class HoverTool extends Tool.Model
    default_view: HoverToolView
    type: "HoverTool"

    defaults: () ->
      return _.extend(super(), {
        renderers: []
      })

    display_defaults: () ->
      super()

  class HoverTools extends Backbone.Collection
    model: HoverTool

  return {
    "Model": HoverTool,
    "Collection": new HoverTools(),
    "View": HoverToolView,
  }
