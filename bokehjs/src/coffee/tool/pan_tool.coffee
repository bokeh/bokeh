
define [
  "underscore"
  "backbone"
  "common/logging"
  "./tool"
  "./event_generators"
], (_, Backbone, Logging, Tool, EventGenerators) ->

  TwoPointEventGenerator = EventGenerators.TwoPointEventGenerator
  logger = Logging.logger

  window.render_count = 0

  class PanToolView extends Tool.View
    initialize: (options) ->
      super(options)
      dims = @mget('dimensions')
      if dims.length == 0
        logger.warn("pan tool given empty dimensions")
      else if dims.length == 1
        if dims[0] == 'width'
          @evgen_options.buttonText = "Pan (x-axis)"
        else if dims[0] == 'height'
          @evgen_options.buttonText = "Pan (y-axis)"
        else
          logger.warn("pan tool given unrecognized dimensions: #{dims}")
      else if dims.length == 2
        if dims.indexOf('width') < 0 or dims.indexOf('height') < 0
          logger.warn("pan tool given unrecognized dimensions: #{dims}")
      else
        logger.warn("pan tool given more than two dimensions: #{dims}")

    bind_bokeh_events: () ->
      super()

    eventGeneratorClass: TwoPointEventGenerator
    toolType: "PanTool"

    evgen_options:
      keyName: null
      buttonText: "Pan"
      buttonIcon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAEwSURBVEiJ5ZbtUcMwDIZfcR0gGxAmICNkhI5QJiEb9DpB2QA2KBskG8AGZYOHH3XAl+bDjpMed7y/fD5Jj2VJTgToFgIE6G6mc55EjrTPgA9gH8sB4oAOVvOr3drAI9cqVwEC+x4YwDmkprMydI5lS4r0m9+lKfqnQGCbEhTIB2P4tffm7DQSbLJpPJvK5wDaeBuFpJOkTFIzMl+FH3jC5hl4lPQk6csnbwdmbCnV3bF4l/Q2dEUL6PCz6tSwcidaqoZnV6r+wTezSv59p6mR9GBmTfc0fSfMhqIEZnjl35thKzNLynDM/2+8NGtqM21yEZevey7p3tur3PLFzD5DA4XaFa7Nu3oN5TDjF6PswOqxjk4GOsedN9RBsCSgc67aFyQWaIDMLBoaC2t187H4BqwdDXMWZF/nAAAAAElFTkSuQmCC"
      cursor: "move"
      auto_deactivate: true
      restrict_to_innercanvas: true

    tool_events:
      UpdatingMouseMove: "_drag",
      SetBasepoint: "_set_base_point"

    mouse_coords: (e, x, y) ->
      [x_, y_] = [@plot_view.canvas.sx_to_vx(x), @plot_view.canvas.sy_to_vy(y)]
      return [x_, y_]

    _set_base_point: (e) ->
      [@x, @y] = @mouse_coords(e, e.bokehX, e.bokehY)
      return null

    _drag: (e) ->
      [x, y] = @mouse_coords(e, e.bokehX, e.bokehY)
      xdiff = x - @x
      ydiff = y - @y
      [@x, @y] = [x, y]

      xr = @plot_view.frame.get('h_range')
      sx_low  = xr.get('start') - xdiff
      sx_high = xr.get('end') - xdiff

      yr = @plot_view.frame.get('v_range')
      sy_low  = yr.get('start') - ydiff
      sy_high = yr.get('end') - ydiff

      dims = @mget('dimensions')

      if dims.indexOf('width') > -1
        sx0 = sx_low
        sx1 = sx_high
        sdx = -xdiff
      else
        sx0 = xr.get('start')
        sx1 = xr.get('end')
        sdx = 0

      if dims.indexOf('height') > -1
        sy0 = sy_low
        sy1 = sy_high
        sdy = ydiff
      else
        sy0 = yr.get('start')
        sy1 = yr.get('end')
        sdy = 0

      xrs = {}
      for name, mapper of @plot_view.frame.get('x_mappers')
        [start, end] = mapper.v_map_from_target([sx0, sx1])
        xrs[name] = {start: start, end: end}

      yrs = {}
      for name, mapper of @plot_view.frame.get('y_mappers')
        [start, end] = mapper.v_map_from_target([sy0, sy1])
        yrs[name] = {start: start, end: end}

      pan_info = {
        xrs: xrs
        yrs: yrs
        sdx: sdx
        sdy: sdy
      }

      @plot_view.update_range(pan_info)
      return null

  class PanTool extends Tool.Model
    default_view: PanToolView
    type: "PanTool"

    defaults: () ->
      return {
        dimensions: ["width", "height"]
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
