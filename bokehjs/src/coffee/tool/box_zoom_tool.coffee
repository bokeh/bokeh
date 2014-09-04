
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
      buttonHook: "box-zoom"
      buttonIcon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAgCAYAAAB3j6rJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDozMjFERDhEMjIwQjIxMUU0ODREQUYzNzM5QTM2MjBCRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDozMjFERDhEMzIwQjIxMUU0ODREQUYzNzM5QTM2MjBCRSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjMyMUREOEQwMjBCMjExRTQ4NERBRjM3MzlBMzYyMEJFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjMyMUREOEQxMjBCMjExRTQ4NERBRjM3MzlBMzYyMEJFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+a2Q0KAAAAmVJREFUeNq8V19EpFEUvzOtmKfpJSJKDL2WiLJExKaUEq0eeikiaolZLT2lVUpPydqHqIlIo1ilFOmphxj1miKWWHppnobIt7+zeyZ3jjvz/bnf9OPHd8/9d77z3XN+94ts7ew6SqksWKX+w1GFiLjYdVSAfeAQ2Ag2sf0GvAXT4C/wle1x3lt9UOGBNk6BrYa+FuYIeAWOsmNviGqe6W+q081OmAGvizgh0cpjZ3RjGBFZBpMG+xn4wM8NYJfWFwNXwXrwS96RiIUTwwYn6AxMgb+FvQ5c4zOUxzR4Ce5GLZyo5LfSsQP2G5xQbKO+bWFfoLWinA1OAEcoM2rFRpMe5sloJWgtm4j0iPZcPhVdkOWxBWvZONIi2uc+5sqxbTaO1Ij2o4+5T6JdGy1SF4Kg2mLsi01E/oh2l4+5HTKaNlmTEe0ka40XyNqTsYnIkWiTwC16rMRNci0bR0hJ7w1veizqy9uB5D4ZDZKBtI3WvLCCJoT9E3jHny4j1DdmWOcbrWWjNYuGoqaL2kdmKayTztio7yzTJprz4A/9PuI3a8YMh5IKVC9fetxAY5rB79pNzXdESMJ/GrSjm8/DCTjAgpjQZCDDh5I+w4HuQBBHOsE9USty4KB2KF85m9J+v5XX9KXr3T7fQZS26WefYlcU+ayJlxhDIT40jBnn21hQOPrfgFtEqAhdGETqK7gZ4h/Av4g4Jf5TUoYquQSuqJDhFpEJca3b4EoYOtyyhrSkHTzlcj4R4t4FZ9NL+j6yMzlT/ocZES9aky3D3r6y5t2gaw3xWXgs7XFhdyzsgSpr2fFXgAEAmp2J9DuX/WgAAAAASUVORK5CYII="
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

      @plot_view._render_levels(@plot_view.ctx, ['overlay'], true)
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
