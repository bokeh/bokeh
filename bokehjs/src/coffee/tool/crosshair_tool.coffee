
define [
  "underscore",
  "backbone",
  "./tool",
  "./event_generators",
], (_, Backbone, Tool, EventGenerators) ->

  TwoPointEventGenerator = EventGenerators.TwoPointEventGenerator

  class CrosshairToolView extends Tool.View
    initialize: (options) ->
      super(options)
      @active = false

    bind_events: (plotview) ->
      super(plotview)

    eventGeneratorClass: TwoPointEventGenerator
    toolType: "CrosshairTool"
    evgen_options: {keyName:"", buttonText:"Crosshair"}
    tool_events: {
      activated: "_activate",
      deactivated: "_deactivate",
      UpdatingMouseMove: "_drag",
      SetBasepoint: "_set_base_point"
    }


    mouse_coords: (e, x, y) ->
      return [x, y]

    _activate: (e) ->
      if @active
        return
      @active = true
      @popup = $(
        '''<div class="resize_popup pull-right"
          style="border-radius: 10px; background-color: lightgrey; padding:3px 8px; font-size: 14px;
          position:absolute; right:20px; top: 20px; "></div>''')
      bbar = @plot_view.$el.find('.bokeh_canvas_wrapper')
      @popup.appendTo(bbar)
      ch = @plot_view.view_state.get('outer_height')
      cw = @plot_view.view_state.get('outer_width')
      @popup.text("x: 0 y:0")

      @request_render()
      @plot_view.$el.css("cursor", "crosshair")
      @plot_view.request_render()
      return null

    _deactivate: (e) ->
      @active = false
      @plot_view.$el.css("cursor", "default")
      @popup.remove()
      @request_render()
      @plot_view.request_render()
      return null

    _set_base_point: (e) ->
      [@x, @y] = @mouse_coords(e, e.bokehX, e.bokehY)
      return null

    _drag: (e) ->
      @plot_view.pause()

      [x, y] = @mouse_coords(e, e.bokehX, e.bokehY)
      xdiff = x - @x
      ydiff = y - @y
      [@x, @y] = [x, y]

      ch = @plot_view.view_state.get('outer_height')
      cw = @plot_view.view_state.get('outer_width')

      data_x = @plot_view.xmapper.map_from_target(x)
      data_y = @plot_view.ymapper.map_from_target(y)
      @popup.text("x: #{data_x} y: #{data_y}")

      return null

  class CrosshairTool extends Tool.Model
    default_view: CrosshairToolView
    type: "CrosshairTool"

    display_defaults: () ->
      super()

  class CrosshairTools extends Backbone.Collection
    model: CrosshairTool

  return {
    "Model": CrosshairTool
    "Collection": new CrosshairTools(),
    "View": CrosshairToolView
  }