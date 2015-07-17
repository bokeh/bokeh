_ = require "underscore"
BoxSelection = require "../../renderer/overlay/box_selection"
SelectTool = require "./select_tool"

class BoxSelectToolView extends SelectTool.View

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

    if @mget('select_every_mousemove')
      append = e.srcEvent.shiftKey ? false
      @_select(vxlim, vylim, false, append)

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
    append = e.srcEvent.shiftKey ? false
    @_select(vxlim, vylim, true, append)

    @mget('overlay').set('data', {})

    @_baseboint = null
    return null

  _select: ([vx0, vx1], [vy0, vy1], final, append=false) ->
    geometry = {
      type: 'rect'
      vx0: vx0
      vx1: vx1
      vy0: vy0
      vy1: vy1
    }

    for r in @mget('renderers')
      ds = r.get('data_source')
      sm = ds.get('selection_manager')
      sm.select(@, @plot_view.renderers[r.id], geometry, final, append)

    if @mget('callback')?
      @_emit_callback(geometry)

    @_save_geometry(geometry, final, append)

    return null

  _emit_callback: (geometry) ->
    r = @mget('renderers')[0]
    canvas = @plot_model.get('canvas')
    frame = @plot_model.get('frame')

    geometry['sx0'] = canvas.vx_to_sx(geometry.vx0)
    geometry['sx1'] = canvas.vx_to_sx(geometry.vx1)
    geometry['sy0'] = canvas.vy_to_sy(geometry.vy0)
    geometry['sy1'] = canvas.vy_to_sy(geometry.vy1)

    xmapper = frame.get('x_mappers')[r.get('x_range_name')]
    ymapper = frame.get('y_mappers')[r.get('y_range_name')]
    geometry['x0'] = xmapper.map_from_target(geometry.vx0)
    geometry['x1'] = xmapper.map_from_target(geometry.vx1)
    geometry['y0'] = ymapper.map_from_target(geometry.vy0)
    geometry['y1'] = ymapper.map_from_target(geometry.vy1)

    @mget('callback').execute(@model, {geometry: geometry})

    return

class BoxSelectTool extends SelectTool.Model
  default_view: BoxSelectToolView
  type: "BoxSelectTool"
  tool_name: "Box Select"
  icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAgCAYAAAB6kdqOAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpBODVDNDBCRjIwQjMxMUU0ODREQUYzNzM5QTM2MjBCRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpBODVDNDBDMDIwQjMxMUU0ODREQUYzNzM5QTM2MjBCRSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkE4NUM0MEJEMjBCMzExRTQ4NERBRjM3MzlBMzYyMEJFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkE4NUM0MEJFMjBCMzExRTQ4NERBRjM3MzlBMzYyMEJFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+hdQ7dQAAAJdJREFUeNpiXLhs5X8GBPgIxAJQNjZxfiD+wIAKGCkUZ0SWZGIYZIAF3YVoPkEHH6kojhUMyhD6jydEaAlgaWnwh9BAgf9DKpfxDxYHjeay0Vw2bHMZw2guG81lwyXKRnMZWlt98JdDTFAX/x9NQwPkIH6kGMAVEyjyo7lstC4jouc69Moh9L42rlyBTZyYXDS00xBAgAEAqsguPe03+cYAAAAASUVORK5CYII="
  event_type: "pan"
  default_order: 30

  initialize: (attrs, options) ->
    super(attrs, options)

    @register_property('tooltip', () ->
        @_get_dim_tooltip(
          @get("tool_name"),
          @_check_dims(@get('dimensions'), "box select tool")
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
      select_every_mousemove: false
    })

module.exports =
  Model: BoxSelectTool
  View: BoxSelectToolView
