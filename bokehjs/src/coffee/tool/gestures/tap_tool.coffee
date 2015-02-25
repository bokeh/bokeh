define [
  "underscore",
  "common/collection",
  "tool/gestures/select_tool",
], (_, Collection, SelectTool) ->

  class TapToolView extends SelectTool.View

    _tap: (e) ->
      canvas = @plot_view.canvas
      vx = canvas.sx_to_vx(e.bokeh.sx)
      vy = canvas.sy_to_vy(e.bokeh.sy)
      append = e.srcEvent.shiftKey ? false
      @_select(vx, vy, true, append)

    _select: (vx, vy, final, append) ->
      geometry = {
        type: 'point'
        vx: vx
        vy: vy
      }

      action = @mget("action")

      for r in @mget('renderers')
        ds = r.get('data_source')
        sm = ds.get('selection_manager')
        sm.select(@, @plot_view.renderers[r.id], geometry, final, append)
        if action? then action.execute(ds)

      @_save_geometry(geometry, final, append)
      return null

  class TapTool extends SelectTool.Model
    default_view: TapToolView
    type: "TapTool"
    tool_name: "Tap"
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAHWSURBVDiNbdJfaI9RGAfwz/7JNlLGjdxLyDU2u0EIx6uc7UIpF5pIU1OSGzfkUhvSiuSCvZbXGxeT0IxcSYlIiVxSJmqZzbj4nbafcer0nM75Ps/5Pt/vU2PWyouyAbsRsTJdv0SOGzELE9X4mlnJ7TiOtentV3qqS/EJTsUsDP9TIC/KvTiHZgyhwHP8Tkx2Ygd+4EDMwpXpAnlRtuJu+vFozMLF2a0lXAfOowkbYxYe1+RF2Yhb2IT9MQv9eVHOxTGsSwxGcCZm4WdelLuSHg8QatGZeh5KyQtxB/NwCIfRgtt5US6IWbiJgZTTWZ/UrsG1xLQHL2IWeqrYd+dF2YdunMRVBMRaLMckXiVwK3r/I0E/tqXzW0xgdX0VYCrFOjO2Va+PuJTO4/iE8Xq8RhuWqdj2FAdxpDo7ZmEUF/KiXIwxrMJUvYqibSrTdx2nUeZFeRaX8SFm4Suk5PcYiVnYAtU2bkBHzMJgXpTNOIHtqfdeLMUS3Mcz7GFmkNbjHr6jK2ZhsJp+XpQt6ec6jKIB86cLJNA+9GFOamsAb1Qc+qJic2PSagzv/iqQirQn6mvS1SQ+Y0WawkXJjUcxC5uhdpbSw9iKLjzEt7QnE6QpxWmb/wA4250STmTc7QAAAABJRU5ErkJggg=="
    event_type: "tap"
    default_order: 10

  class TapTools extends Collection
    model: TapTool

  return {
    Model: TapTool,
    Collection: new TapTools(),
    View: TapToolView,
  }
