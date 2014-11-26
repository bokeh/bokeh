
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
        [start, end] = mapper.v_map_from_target(vxlim)
        xrs[name] = {start: start, end: end}

      yrs = {}
      for name, mapper of @plot_view.frame.get('y_mappers')
        [start, end] = mapper.v_map_from_target(vylim)
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
    icon: "bk-icon-boxzoom"
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
