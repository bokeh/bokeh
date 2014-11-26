
define [
  "underscore"
  "common/collection"
  "renderer/overlay/box_selection"
  "tool/gestures/select_tool"
], (_, Collection, BoxSelection, SelectTool) ->

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

      @_save_geometry(geometry, final, append)

      return null

  class BoxSelectTool extends SelectTool.Model
    default_view: BoxSelectToolView
    type: "BoxSelectTool"
    tool_name: "Box Select"
    icon: "bk-icon-boxselect"
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

  class BoxSelectTools extends Collection
    model: BoxSelectTool

  return {
    "Model": BoxSelectTool,
    "Collection": new BoxSelectTools(),
    "View": BoxSelectToolView,
  }
