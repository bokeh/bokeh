
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
      append = e.srcEvent.shiftKey ? false
      @_select(@data.vx, @data.vy, true, append)

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

    _select: (vx, vy, final, append) ->
      geometry = {
        type: 'poly'
        vx: vx
        vy: vy
      }

      for r in @mget('renderers')
        ds = r.get('data_source')
        sm = ds.get('selection_manager')
        sm.select(@, @plot_view.renderers[r.id], geometry, final, append)

      @_save_geometry(geometry, final, append)

      return null

  class PolySelectTool extends SelectTool.Model
    default_view: PolySelectToolView
    type: "PolySelectTool"
    tool_name: "Poly Select"
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAGdSURBVDiNjdO/axRBGMbxT8IiwSBBi4AiBBVRJE3UIqIIilrYLGuxMYo/AimsrNTCWkH/AbFR78Dc5dZiWW3SKQaVaKWlIFEiithooaiIZ7EbPM7b3D0wzLzzvvOdZ5iZviTNmnKN4gE2YSteYjW24A2+Yh/ux1G4uVij2cyXB0V8AYuYwBq8x5Ei/wEH8LNoHRVgWxyFr4v4RUvuScv4ESRpFhTQ/9SPmSTNdpbt1KZhXCsD7cZQj6AB7OqUCDCCTz2C3mF/maNnGOsRtB53y0BD/t1eN32T32pH0HY870ZI0mwMFZwvA73F+AqA4STNduCS3PlSpdbY0F4XFKAfJZA9mMO9OAonl+crtcZcpdaYP3ti4mqro0Py79AKOJqk2TwGMRVH4XTbHqtwpVJrVKv1ZGDZ0SIO4mGSZqNYh2m8wtM4Cr93MPur6E9jY7WenAvkz38pSbO9eIzrcRQe63TUFg3iDz7iIj73Yxa3i4LxOAovr0S4MzPbhzoOYy1GzkzGXwLcxC0sxFH4u4sTUyePN3EDKrXGAk4h/QvU5XGB9rRYawAAAABJRU5ErkJggg=="
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
