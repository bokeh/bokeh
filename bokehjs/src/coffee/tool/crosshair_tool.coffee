
define [
  "underscore",
  "backbone",
  "./tool",
  "./event_generators",
  "sprintf",
], (_, Backbone, Tool, EventGenerators, sprintf) ->

  TwoPointEventGenerator = EventGenerators.TwoPointEventGenerator

  class CrosshairToolView extends Tool.View
    initialize: (options) ->
      super(options)
      @active = false

    bind_events: (plotview) ->
      super(plotview)

    eventGeneratorClass: TwoPointEventGenerator
    toolType: "CrosshairTool"

    evgen_options:
      keyName: ""
      buttonText: "Crosshair"
      cursor: "crosshair"

    tool_events:
      activated: "_activate"
      deactivated: "_deactivate"
      UpdatingMouseMove: "_drag"
      SetBasepoint: "_set_base_point"

    render: () ->
      if not @active
        return

      ctx = @plot_view.ctx

      cw = @plot_view.view_state.get('canvas_width')
      ch = @plot_view.view_state.get('canvas_height')

      line_width = 1

      ctx.save()

      ctx.strokeStyle = 'red'
      ctx.globalAlpha = 0.7
      ctx.lineWidth   = line_width
      ctx.setLineDash([])

      ctx.beginPath()
      ctx.moveTo(0,@y)
      ctx.lineTo(cw,@y)
      console.log(@x,@y)
      ctx.moveTo(@x, 0)
      ctx.lineTo(@x, ch)
      ctx.stroke()
      ctx.restore()

    mouse_coords: (e, x, y) ->
      return [x, y]

    _activate: (e) ->
      if @active
        return
      @active = true
      #[@x,@y] = [5,5]
      @popup = $(
        '''<div class="resize_popup pull-right"
          style="border-radius: 10px; background-color: lightgrey; padding:3px 8px; font-size: 14px;
          position:absolute; right:20px; top: 20px; "></div>''')
      bbar = @plot_view.$el.find('.bokeh_canvas_wrapper')
      @popup.appendTo(bbar)
      ch = @plot_view.view_state.get('outer_height')
      cw = @plot_view.view_state.get('outer_width')
      @popup.text("x: 0 y:0")
      @plot_view.$el.css("cursor", "crosshair")
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

      [@x, @y] = @mouse_coords(e, e.bokehX, e.bokehY)
      data_x = sprintf("%.4f", @plot_view.xmapper.map_from_target(x))
      data_y = sprintf("%.4f", @plot_view.ymapper.map_from_target(y))
      @popup.text("x: #{data_x} y: #{data_y}")
      @request_render()
      @plot_view.request_render()
      @plot_view.unpause(true)
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
