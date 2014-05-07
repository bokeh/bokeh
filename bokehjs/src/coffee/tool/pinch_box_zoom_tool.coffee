
define [
  "underscore",
  "backbone",
  "./tool",
  "./event_generators",
], (_, Backbone, Tool, EventGenerators) ->

  TwoPointEventGenerator = EventGenerators.TwoPointEventGenerator

  class PinchBoxZoomToolView extends Tool.View
    initialize: (options) ->
      super(options)

    bind_bokeh_events: () ->
      super()

    eventGeneratorClass: TwoPointEventGenerator
    toolType: "PinchBoxZoomTool"

    evgen_options:
      keyName: "ctrlKey"
      buttonText: "Pinch Box Zoom"
      cursor: "crosshair"
      auto_deactivate: true
      restrict_to_innercanvas: true
      touch_event: EventGenerators.isTouch
      gesture: true

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
      if e.originalEvent.touches.length < 2
        @touch_move = false
        return null

      @plot_view.pause()
      @trigger('startselect')

      @touch_start1 = [e.bokehX, e.bokehY]
      @touch_start2 = [e.bokehX1, e.bokehY1]

      [vx1, vy1] = @view_coords(@touch_start1[0], @touch_start1[1])
      [vx2, vy2] = @view_coords(@touch_start2[0], @touch_start2[1])

      @mset({'start_vx': vx1, 'start_vy': vy1, 'current_vx': vx2, 'current_vy': vy2})
      @basepoint_set = true
      [@xrange, @yrange] = @_get_selection_range()

      @trigger('boxselect', @xrange, @yrange)
      @plot_view.render_overlays(true)
      @touch_move = true

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
      if e.originalEvent.touches.length < 2
        return null

      @touch_end1 = [e.bokehX, e.bokehY]
      @touch_end2 = [e.bokehX1, e.bokehY1]
      
      [vx1, vy1] = @view_coords(@touch_end1[0], @touch_end1[1])
      [vx2, vy2] = @view_coords(@touch_end2[0], @touch_end2[1])
      @mset({'start_vx': vx1, 'start_vy': vy1, 'current_vx': vx2, 'current_vy': vy2})

      [@xrange, @yrange] = @_get_selection_range()
      @trigger('boxselect', @xrange, @yrange)

      @plot_view.render_overlays(true)
      @scale_factor = e.originalEvent.scale
      return null

    _dragend : (e) ->
      if e[1] < 300
        @_select_data()
      @basepoint_set = false
      @plot_view.unpause()
      @trigger('stopselect')

    _select_data: () ->
      if not @basepoint_set or not @touch_move
        return

      if @scale_factor < 1
        [vx1, vy1] = @view_coords(@touch_start1[0], @touch_start1[1])
        [vx2, vy2] = @view_coords(@touch_start2[0], @touch_start2[1])
        [vx3, vy3] = @view_coords(@touch_end1[0], @touch_end1[1])
        [vx4, vy4] = @view_coords(@touch_end2[0], @touch_end2[1])

        [d1, d3] = @plot_view.xmapper.v_map_from_target([vx1, vy1])
        [d2, d4] = @plot_view.xmapper.v_map_from_target([vx2, vy2])
        
        if d1 > d2
          xstart1 = d2
          xstart2 = d1
        else
          xstart1 = d1
          xstart2 = d2
        if d3 > d4
          yend1 = d4
          yend2 = d3
        else
          yend1 = d3
          yend2 = d4
        
        screenW = @plot_view.view_state.get('inner_width')
        screenH = @plot_view.view_state.get('inner_height')
        
        scaleX = Math.abs((xstart2 - xstart1) / (vx4 - vx3))
        scaleY = Math.abs((yend2 - yend1) / (vy4 - vy3))
        
        xstart = xstart1 - (vx3 * scaleX)
        xend = xstart + (screenW * scaleX)
        ystart = yend1 - (vy3 * scaleY)
        yend = ystart + (screenH * scaleY)
      else
        [xstart, xend] = @plot_view.xmapper.v_map_from_target([@xrange[0], @xrange[1]])
        [ystart, yend] = @plot_view.ymapper.v_map_from_target([@yrange[0], @yrange[1]])

      zoom_info = {
        xr: {start: xstart, end: xend}
        yr: {start: ystart, end: yend}
      }
      
      @plot_view.update_range(zoom_info)

  class PinchBoxZoomTool extends Tool.Model
    default_view: PinchBoxZoomToolView
    type: "PinchBoxZoomTool"

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

  class PinchBoxZoomTools extends Backbone.Collection
    model: PinchBoxZoomTool

  return {
    "Model": PinchBoxZoomTool,
    "Collection": new PinchBoxZoomTools(),
    "View": PinchBoxZoomToolView,
  }
