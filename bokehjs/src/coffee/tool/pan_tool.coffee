
define [
  "underscore",
  "backbone",
  "./tool",
  "./event_generators",
], (_, Backbone, Tool, EventGenerators) ->

  TwoPointEventGenerator = EventGenerators.TwoPointEventGenerator

  window.render_count = 0

  class PanToolView extends Tool.View
    initialize: (options) ->
      super(options)

    bind_bokeh_events: () ->
      super()

    eventGeneratorClass: TwoPointEventGenerator
    toolType: "PanTool"

    evgen_options:
      keyName: null
      buttonText: "Pan"
      cursor: "move"
      auto_deactivate: true
      restrict_to_innercanvas: true

    tool_events:
      UpdatingMouseMove: "_drag",
      SetBasepoint: "_set_base_point"

    mouse_coords: (e, x, y) ->
      [x_, y_] = [@plot_view.view_state.sx_to_vx(x), @plot_view.view_state.sy_to_vy(y)]
      return [x_, y_]

    _set_base_point: (e) ->
      [@x, @y] = @mouse_coords(e, e.bokehX, e.bokehY)
      return null

    _drag: (e) ->
      [x, y] = @mouse_coords(e, e.bokehX, e.bokehY)
      xdiff = x - @x
      ydiff = y - @y
      [@x, @y] = [x, y]

      xr = @plot_view.view_state.get('inner_range_horizontal')
      sx_low  = xr.get('start') - xdiff
      sx_high = xr.get('end') - xdiff

      yr = @plot_view.view_state.get('inner_range_vertical')
      sy_low  = yr.get('start') - ydiff
      sy_high = yr.get('end') - ydiff

      xstart = @plot_view.xmapper.map_from_target(sx_low)
      xend   = @plot_view.xmapper.map_from_target(sx_high)
      ystart = @plot_view.ymapper.map_from_target(sy_low)
      yend   = @plot_view.ymapper.map_from_target(sy_high)

      pan_info = {
        xr: {start: xstart, end: xend}
        yr: {start: ystart, end: yend}
        sdx: -xdiff
        sdy: ydiff
      }

      @plot_view.update_range(pan_info)
      return null

  class PanTool extends Tool.Model
    default_view: PanToolView
    type: "PanTool"

    defaults: () ->
      return {
        dimensions: [] #height/width
      }

    display_defaults: () ->
      super()

  class PanTools extends Backbone.Collection
    model: PanTool

  return {
    "Model": PanTool,
    "Collection": new PanTools(),
    "View": PanToolView,
  }
