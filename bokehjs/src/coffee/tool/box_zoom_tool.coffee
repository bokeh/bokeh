
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
      buttonIcon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAFKSURBVEiJ7ZZhecMgEIZhzwRUAhIigTmYhEiJg0mIhElAQiWkDlIH737saCnlgLTNr+37UyjHvbl8XBILGGut2VPAZfy2K6mgPwbkV0HGkzL/zPY4YAZWrlqAL+BgjLk9I6mhQMgT1gSM1LUCQ+QAt8AtAnyWeJL/vFSXrrkiUDa5TmDIq8jWhwQ6a0AA3wFzSbKxEhcrXTVgKF1tIdHldvbGReB7GmCt/WjBnlXeFr0enpI9tVPt5fecQtJxl4cSu0j8gvRbtj5w7U310HR5KLHxQRChoxwmJ2sRprdFr2g3fNQa75hWYdPDDLbK/LsAm9NcGhAqHhZgQ7buNUs2e9iCtbTJw2dhKlDzEDgK7NjyuHChvgYseggc5BDc9VsDGICpBlQ9fETNCvdUBD76LO2FjHcWFTxsfdO05sg8vpqmtELL/4fwi/UDzP86Q6mEI4kAAAAASUVORK5CYII="
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
        @plot_view.canvas.sx_to_vx(sx),
        @plot_view.canvas.sy_to_vy(sy)
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

      @plot_view._render_levels(@plot_view.canvas_view.ctx, ['overlay'])
      return null

    _dragend : () ->
      @_select_data()
      @basepoint_set = false
      @plot_view.unpause()
      @trigger('stopselect')

    _select_data: () ->
      if not @basepoint_set
        return

      xrs = {}
      for name, mapper of @plot_view.frame.get('x_mappers')
        [start, end] = mapper.v_map_from_target([@xrange[0], @xrange[1]])
        xrs[name] = {start: start, end: end}

      yrs = {}
      for name, mapper of @plot_view.frame.get('y_mappers')
        [start, end] = mapper.v_map_from_target([@yrange[0], @yrange[1]])
        yrs[name] = {start: start, end: end}

      zoom_info = {
        xrs: xrs
        yrs: yrs
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
