
define [
  "underscore"
  "common/collection"
  "renderer/overlay/poly_selection"
  "tool/gestures/select_tool"
], (_, Collection, PolySelection, SelectTool) ->

  class PolySelectToolView extends SelectTool.View

    initialize: (options) ->
      super(options)
      @listenTo(@model, 'change:active', @_active_change)
      @data = null

    _active_change: () ->
      if not @mget('active')
        @_clear_data()

    _keyup: (e) ->
      if e.keyCode == 13
        @_clear_data()

    _doubletap: (e)->
      @_clear_data()

    _clear_data: () ->
        @data = null
        @mget('overlay').set('data', null)

    _tap: (e) ->
      canvas = @plot_view.canvas
      vx = canvas.sx_to_vx(e.bokeh.sx)
      vy = canvas.sy_to_vy(e.bokeh.sy)

      if not @data?
        @data = {vx: [vx], vy: [vy]}
        return null

      @data.vx.push(vx)
      @data.vy.push(vy)

      overlay = @mget('overlay')
      new_data = {}
      new_data.vx = _.clone(@data.vx)
      new_data.vy = _.clone(@data.vy)
      overlay.set('data', new_data)

      append = e.srcEvent.shiftKey ? false
      @_select(@data.vx, @data.vy, append)

    _select: (vx, vy, append) ->
      geometry = {
        type: 'poly'
        vx: vx
        vy: vy
      }

      for r in @mget('renderers')
        ds = r.get('data_source')
        sm = ds.get('selection_manager')
        sm.select(@, @plot_view.renderers[r.id], geometry, true, append)

      @_save_geometry(geometry, true, append)

      return null

  class PolySelectTool extends SelectTool.Model
    default_view: PolySelectToolView
    type: "PolySelectTool"
    tool_name: "Poly Select"
    icon: "bk-icon-polyselect"
    event_type: "tap"
    default_order: 11

    initialize: (attrs, options) ->
      super(attrs, options)
      @set('overlay', new PolySelection.Model)
      plot_renderers = @get('plot').get('renderers')
      plot_renderers.push(@get('overlay'))
      @get('plot').set('renderers', plot_renderers)

  class PolySelectTools extends Collection
    model: PolySelectTool

  return {
    "Model": PolySelectTool,
    "Collection": new PolySelectTools(),
    "View": PolySelectToolView,
  }
