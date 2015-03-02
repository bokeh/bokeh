
define [
  "underscore"
  "common/collection"
  "renderer/overlay/box_selection"
  "tool/gestures/gesture_tool"
], (_, Collection, BoxSelection, GestureTool) ->

  class BoxZoomToolView extends GestureTool.View

    _pan_start: (e) ->
      canvas = @plot_view.canvas
      @_baseboint = [
        canvas.sx_to_vx(e.bokeh.sx)
        canvas.sy_to_vy(e.bokeh.sy)
      ]
      return null

    _pan: (e) ->
      canvas = @plot_view.canvas
      curpoint = [
        canvas.sx_to_vx(e.bokeh.sx)
        canvas.sy_to_vy(e.bokeh.sy)
      ]
      frame = @plot_model.get('frame')
      dims = @mget('dimensions')

      [vxlim, vylim] = @model._get_dim_limits(@_baseboint, curpoint, frame, dims)
      @mget('overlay').set('data', {vxlim: vxlim, vylim: vylim})

      return null

     _pan_end: (e) ->
      canvas = @plot_view.canvas
      curpoint = [
        canvas.sx_to_vx(e.bokeh.sx)
        canvas.sy_to_vy(e.bokeh.sy)
      ]
      frame = @plot_model.get('frame')
      dims = @mget('dimensions')

      [vxlim, vylim] = @model._get_dim_limits(@_baseboint, curpoint, frame, dims)
      @_update(vxlim, vylim)
      @mget('overlay').set('data', {})

      @_baseboint = null
      return null

    _update: (vxlim, vylim) ->
      xrs = {}
      for name, mapper of @plot_view.frame.get('x_mappers')
        [start, end] = mapper.v_map_from_target(vxlim, true)
        xrs[name] = {start: start, end: end}

      yrs = {}
      for name, mapper of @plot_view.frame.get('y_mappers')
        [start, end] = mapper.v_map_from_target(vylim, true)
        yrs[name] = {start: start, end: end}

      zoom_info = {
        xrs: xrs
        yrs: yrs
      }
      @plot_view.update_range(zoom_info)

  class BoxZoomTool extends GestureTool.Model
    default_view: BoxZoomToolView
    type: "BoxZoomTool"
    tool_name: "Box Zoom"
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAgCAYAAAB3j6rJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDozMjFERDhEMjIwQjIxMUU0ODREQUYzNzM5QTM2MjBCRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDozMjFERDhEMzIwQjIxMUU0ODREQUYzNzM5QTM2MjBCRSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjMyMUREOEQwMjBCMjExRTQ4NERBRjM3MzlBMzYyMEJFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjMyMUREOEQxMjBCMjExRTQ4NERBRjM3MzlBMzYyMEJFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+a2Q0KAAAAmVJREFUeNq8V19EpFEUvzOtmKfpJSJKDL2WiLJExKaUEq0eeikiaolZLT2lVUpPydqHqIlIo1ilFOmphxj1miKWWHppnobIt7+zeyZ3jjvz/bnf9OPHd8/9d77z3XN+94ts7ew6SqksWKX+w1GFiLjYdVSAfeAQ2Ag2sf0GvAXT4C/wle1x3lt9UOGBNk6BrYa+FuYIeAWOsmNviGqe6W+q081OmAGvizgh0cpjZ3RjGBFZBpMG+xn4wM8NYJfWFwNXwXrwS96RiIUTwwYn6AxMgb+FvQ5c4zOUxzR4Ce5GLZyo5LfSsQP2G5xQbKO+bWFfoLWinA1OAEcoM2rFRpMe5sloJWgtm4j0iPZcPhVdkOWxBWvZONIi2uc+5sqxbTaO1Ij2o4+5T6JdGy1SF4Kg2mLsi01E/oh2l4+5HTKaNlmTEe0ka40XyNqTsYnIkWiTwC16rMRNci0bR0hJ7w1veizqy9uB5D4ZDZKBtI3WvLCCJoT9E3jHny4j1DdmWOcbrWWjNYuGoqaL2kdmKayTztio7yzTJprz4A/9PuI3a8YMh5IKVC9fetxAY5rB79pNzXdESMJ/GrSjm8/DCTjAgpjQZCDDh5I+w4HuQBBHOsE9USty4KB2KF85m9J+v5XX9KXr3T7fQZS26WefYlcU+ayJlxhDIT40jBnn21hQOPrfgFtEqAhdGETqK7gZ4h/Av4g4Jf5TUoYquQSuqJDhFpEJca3b4EoYOtyyhrSkHTzlcj4R4t4FZ9NL+j6yMzlT/ocZES9aky3D3r6y5t2gaw3xWXgs7XFhdyzsgSpr2fFXgAEAmp2J9DuX/WgAAAAASUVORK5CYII="
    event_type: "pan"
    default_order: 20

    initialize: (attrs, options) ->
      super(attrs, options)

      @register_property('tooltip', () ->
          @_get_dim_tooltip(
            @get("tool_name"),
            @_check_dims(@get('dimensions'), "box zoom tool")
          )
        , false)
      @add_dependencies('tooltip', this, ['dimensions'])

      @set('overlay', new BoxSelection.Model)
      plot_renderers = @get('plot').get('renderers')
      plot_renderers.push(@get('overlay'))
      @get('plot').set('renderers', plot_renderers)

    defaults: () ->
      return _.extend({}, super(), {
        dimensions: ["width", "height"]
      })

  class BoxZoomTools extends Collection
    model: BoxZoomTool

  return {
    "Model": BoxZoomTool,
    "Collection": new BoxZoomTools(),
    "View": BoxZoomToolView,
  }
