_ = require "underscore"
SelectTool = require "./select_tool"

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
    overlay.update({xs: @data.vx, ys: @data.vy})

    if @mget('select_every_mousemove')
      append = e.srcEvent.shiftKey ? false
      @_select(@data.vx, @data.vy, false, append)

  _pan_end: (e) ->
    @_clear_overlay()
    append = e.srcEvent.shiftKey ? false
    @_select(@data.vx, @data.vy, true, append)

  _clear_overlay: () ->
    @mget('overlay').update({xs:[], ys:[]})

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

class LassoSelectTool extends SelectTool.Model
  default_view: LassoSelectToolView
  type: "LassoSelectTool"
  tool_name: "Lasso Select"
  icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAGlSURBVDiNldNNiM1hFMfxz/3PHQqxoCgWYmNDk0jyUqwsuP/719xnPVkQStl4mYWpsVXKQkYpL1m4qWmyYElZkDLKyiSbkdKYNBovo8m1uM+d/nPd/2TO6nn5nW+/c57zlCwQ9eGRBPuwF7uxAUswjme4V6tWxqFUAFiLXlSxDaswiz9RkqAL79Ffq1YeldoAXTiNs9iIn3iN0Zj0OULWYycORU1fKQdZh5s4ggncxX28DVk6W+D8MG5hrJQr5Ql68AADIUvfFTZvPuw5VpZjOVcjZCBk6eD/ACJkF7ZgMMEJVHB7kZDNeIhXGEpwEg3cWASkFy9i3vFatTJTxvJ4sAcvo3ANpkOW/sold+MgTsUKRlGbm6P68Mh59GvOSR2/cVTzqYfifisOYDtm4vmlkKVTjUZDC5TgIi5gBX7gG7qxVHNuluEjHuN6yNI3LadzoJz1HejDMXzP3X2Njp+GLJ1o79c/oBzwGgK+YHV0cyVk6eV27YKgCNuEKZzBubjeH7J0rAiUdAKFLP0QsnQSdzCp+Wl7Omlb0RGUi0+YRlmz+YXxF2YZkqkolYwKAAAAAElFTkSuQmCC"
  event_type: "pan"
  default_order: 12

  initialize: (attrs, options) ->
    super(attrs, options)
    @get('overlay').set('silent_update', true, {silent: true})

  defaults: () ->
    return _.extend({}, super(), {
      select_every_mousemove: true
    })

module.exports =
  Model: LassoSelectTool
  View: LassoSelectToolView