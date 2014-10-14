
define [
  "underscore"
  "common/collection"
  "renderer/overlay/poly_selection"
  "tool/gestures/select_tool"
], (_, Collection, PolySelection, SelectTool) ->

  class LassoSelectToolView extends SelectTool.View

    initialize: (options) ->
      super(options)
      @listenTo(@model, 'change:active', @_active_change)
      @data = null

    _active_change: () ->
      if not @mget('active')
        @_clear_overlay()

    _keyup: (e) ->
      if e.keyCode == 13
        @_clear_overlay()

    _pan_start: (e) ->
      canvas = @plot_view.canvas
      vx = canvas.sx_to_vx(e.bokeh.sx)
      vy = canvas.sy_to_vy(e.bokeh.sy)

      @data = {vx: [vx], vy: [vy]}
      return null

    _pan: (e) ->
      canvas = @plot_view.canvas
      vx = canvas.sx_to_vx(e.bokeh.sx)
      vy = canvas.sy_to_vy(e.bokeh.sy)

      @data.vx.push(vx)
      @data.vy.push(vy)

      overlay = @mget('overlay')
      new_data = {}
      new_data.vx = _.clone(@data.vx)
      new_data.vy = _.clone(@data.vy)
      overlay.set('data', new_data)

      append = e.srcEvent.shiftKey ? false
      @_select(@data.vx, @data.vy, append)

    _pan_end: (e) ->
      @_clear_overlay()

    _clear_overlay: () ->
      @mget('overlay').set('data', null)

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

  class LassoSelectTool extends SelectTool.Model
    default_view: LassoSelectToolView
    type: "LassoSelectTool"
    tool_name: "Lasso Select"
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoyMEJFNzQ5NjQ0MzYxMUU0QTE0ODk2NTE1M0M0MkZENCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDoyMEJFNzQ5NzQ0MzYxMUU0QTE0ODk2NTE1M0M0MkZENCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjIwQkU3NDk0NDQzNjExRTRBMTQ4OTY1MTUzQzQyRkQ0IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjIwQkU3NDk1NDQzNjExRTRBMTQ4OTY1MTUzQzQyRkQ0Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+pIAoFAAAAT9JREFUeNqU0kFEREEcx/FpS5eiSERErJaIsnWLbl0idUhstlt1iToW0aXDXkrnSLcoZbWHrCLtIRGRStdOnZYoEXXp++c3jPW2t/vns4/ZN7+Z+c9rOM6fuYjqRgYTaEUab7jDPW5xZS82VUy0F3cxWiV0WqyKmPMBzdjGcjChjLxWfMEXGpFUyCy2fMCBtmz1hA0UXHRZ4BEGkbWAtWByDusuvnp0pO8EPysa3Ktxcj+u1dx9C+gKtv5fpdTgR/TqKJt2hBLGrCEYwac8owMDup10EHZpN4AfC1jFBToxH7OLsvq04wcs4AFDWrE9YtKHdmlXemirhn/6a7Sv7Dy4DatfjKthVSv8EpfQhxbc4DRucmWAdXYY71hwNVYYkNXzxA/MTE3GBiSC1RfVoJyro/wO2nQb9v2/1hPwJ8AA0Ec/EomZCyoAAAAASUVORK5CYII="
    event_type: "pan"
    default_order: 12

    initialize: (attrs, options) ->
      super(attrs, options)
      @set('overlay', new PolySelection.Model)
      plot_renderers = @get('plot').get('renderers')
      plot_renderers.push(@get('overlay'))
      @get('plot').set('renderers', plot_renderers)

  class LassoSelectTools extends Collection
    model: LassoSelectTool

  return {
    "Model": LassoSelectTool,
    "Collection": new LassoSelectTools(),
    "View": LassoSelectToolView,
  }
