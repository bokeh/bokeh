
define [
  "underscore",
  "backbone",
  "./tool",
  "./event_generators",
], (_, Backbone, Tool, EventGenerators) ->

  TwoPointEventGenerator = EventGenerators.TwoPointEventGenerator

  class ResizeToolView extends Tool.View
    initialize: (options) ->
      super(options)
      @active = false

    bind_events: (plotview) ->
      super(plotview)

    eventGeneratorClass: TwoPointEventGenerator
    toolType: "ResizeTool"

    evgen_options:
      keyName: ""
      buttonText: "Resize"
      buttonIcon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAB7SURBVEiJ7ZZLDsAgCESdxvtfmW5aUpAQE6gmhtnpgsdHM4CI2kpdS2k7gF2dub8AEAlMclYcSwPDoG+chykeyQA0sgtx9YWYYVZ1HtSsMJqA16Hzv0UBC1jAAh4IdN0i0RdZosI/AG3G8bOM2Mp/AL5VJi9RLNQinK0b0hcrObYWZu0AAAAASUVORK5CYII="
      cursor: "move"

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

      line_width = 8

      ctx.save()

      ctx.strokeStyle = 'transparent'
      ctx.globalAlpha = 0.7
      ctx.lineWidth   = line_width
      ctx.setLineDash([])

      ctx.beginPath()
      ctx.rect(line_width, line_width, cw-line_width*2, ch-line_width*2)
      ctx.moveTo(line_width, line_width)
      ctx.lineTo(cw-line_width, ch-line_width)
      ctx.moveTo(line_width, ch-line_width)
      ctx.lineTo(cw-line_width, line_width)
      ctx.stroke()

      ctx.restore()

    mouse_coords: (e, x, y) ->
      return [x, y]

    _activate: (e) ->
      if @active
        return
      @active = true
      @popup = $(
        '''<div class="resize_bokeh_plot pull-right hide"/>''')
      bbar = @plot_view.$el.find('.bokeh_canvas_wrapper')
      plotarea = @plot_view.$el.find('.plotarea')
      popupHtml = @plot_view.$el.find('.resize_popup')
      @popup.appendTo(bbar)
      ch = @plot_view.view_state.get('outer_height')
      cw = @plot_view.view_state.get('outer_width')
      
      @request_render()
      @plot_view.request_render()
      return null

    _deactivate: (e) ->
      @active = false
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

      #@popup.text("width: #{cw} height: #{ch}")

      @plot_view.view_state.set('outer_height', ch+ydiff, {'silent': true})
      @plot_view.view_state.set('outer_width', cw+xdiff, {'silent': true})
      @plot_view.view_state.set('canvas_height', ch+ydiff, {'silent': true})
      @plot_view.view_state.set('canvas_width', cw+xdiff, {'silent': true})

      @plot_view.view_state.trigger('change:outer_height', ch+ydiff)
      @plot_view.view_state.trigger('change:outer_width', cw+xdiff)
      @plot_view.view_state.trigger('change:canvas_height', ch+ydiff)
      @plot_view.view_state.trigger('change:canvas_width', cw+xdiff)
      @plot_view.view_state.trigger('change', @plot_view.view_state)
      @plot_view.unpause(true)

      return null

  class ResizeTool extends Tool.Model
    default_view: ResizeToolView
    type: "ResizeTool"

    display_defaults: () ->
      super()

  class ResizeTools extends Backbone.Collection
    model: ResizeTool

  return {
    "Model": ResizeTool
    "Collection": new ResizeTools(),
    "View": ResizeToolView
  }
