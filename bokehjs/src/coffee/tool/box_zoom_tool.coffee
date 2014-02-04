
define [
  "underscore",
  "backbone",
  "./tool",
  "./event_generators",
], (_, Backbone, Tool, EventGenerators) ->

  TwoPointEventGenerator = EventGenerators.TwoPointEventGenerator

  class BoxZoomToolView extends Tool.View
    initialize: (options) ->
      super(options)

    bind_bokeh_events: () ->
      super()

    eventGeneratorClass: TwoPointEventGenerator
    toolType: "BoxZoomTool"

    evgen_options:
      keyName: "ctrlKey"
      buttonText: "Box Zoom"
      cursor: "crosshair"
      auto_deactivate: true
      restrict_to_innercanvas: true

    tool_events:
      SetBasepoint: "_start_selecting"
      UpdatingMouseMove: "_selecting"
      DragEnd: "_dragend"

    pause:()->
      return null

    view_coords: (sx, sy) ->
      [vx, vy] = [
        @plot_view.view_state.sx_to_vx(sx),
        @plot_view.view_state.sy_to_vy(sy)
      ]
      return [vx, vy]

    _start_selecting: (e) ->
      @plot_view.pause()
      @trigger('startselect')
      [vx, vy] = @view_coords(e.bokehX, e.bokehY)
      @mset({'start_vx': vx, 'start_vy': vy, 'current_vx': null, 'current_vy': null})
      @basepoint_set = true

    _get_selection_range: ->
      if @mget('select_x')
        xrange = [@mget('start_vx'), @mget('current_vx')]
        xrange = [_.min(xrange), _.max(xrange)]
      else
        xrange = null
      if @mget('select_y')
        yrange = [@mget('start_vy'), @mget('current_vy')]
        yrange = [_.min(yrange), _.max(yrange)]
      else
        yrange = null
      return [xrange, yrange]

    _selecting: (e, x_, y_) ->
      [vx, vy] = @view_coords(e.bokehX, e.bokehY)
      @mset({'current_vx': vx, 'current_vy': vy})

      [@xrange, @yrange] = @_get_selection_range()
      @trigger('boxselect', @xrange, @yrange)

      @plot_view.render_overlays(true)
      return null

    _dragend : () ->
      @_select_data()
      @basepoint_set = false
      @plot_view.unpause()
      @trigger('stopselect')

    _select_data: () ->
      if not @basepoint_set
        return

      [xstart, xend] = @plot_view.xmapper.v_map_from_target([@xrange[0], @xrange[1]])
      [ystart, yend] = @plot_view.ymapper.v_map_from_target([@yrange[0], @yrange[1]])

      zoom_info = {
        xr: {start: xstart, end: xend}
        yr: {start: ystart, end: yend}
      }
      @plot_view.update_range(zoom_info)

  class BoxZoomTool extends Tool.Model
    default_view: BoxZoomToolView
    type: "BoxZoomTool"

    defaults: () ->
      return _.extend(super(), {
        renderers: []
        select_x: true
        select_y: true
        select_every_mousemove: false
        data_source_options: {} # backbone options for save on datasource
      })

    display_defaults: () ->
      super()

  class BoxZoomTools extends Backbone.Collection
    model: BoxZoomTool

  return {
    "Model": BoxZoomTool,
    "Collection": new BoxZoomTools(),
    "View": BoxZoomToolView,
  }
