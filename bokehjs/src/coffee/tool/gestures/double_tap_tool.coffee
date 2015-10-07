_ = require "underscore"
SelectTool = require "./select_tool"

class DoubleTapToolView extends SelectTool.View

  _doubletap: (e) ->
    canvas = @plot_view.canvas
    frame = @plot_model.get('frame')

    hr = frame.get('h_range')
    vr = frame.get('v_range')

    x_mapper = frame.get('x_mappers')['default']
    y_mapper = frame.get('y_mappers')['default']

    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)

    plot_x = x_mapper.map_from_target(vx)
    plot_y = y_mapper.map_from_target(vy)

    plot_x2 = x_mapper.v_map_from_target([vx], true)
    plot_y2 = y_mapper.v_map_from_target([vy], true)

    debugger

    e.bokeh.plot_x =  plot_x
    e.bokeh.plot_y = plot_y

    for key, value of @plot_view.renderers
      value.trigger("doubletap", e)

class DoubleTapTool extends SelectTool.Model
  default_view: DoubleTapToolView
  type: "DoubleTapTool"
  tool_name: "DoubleTap"
  icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAHWSURBVDiNbdJfaI9RGAfwz/7JNlLGjdxLyDU2u0EIx6uc7UIpF5pIU1OSGzfkUhvSiuSCvZbXGxeT0IxcSYlIiVxSJmqZzbj4nbafcer0nM75Ps/5Pt/vU2PWyouyAbsRsTJdv0SOGzELE9X4mlnJ7TiOtentV3qqS/EJTsUsDP9TIC/KvTiHZgyhwHP8Tkx2Ygd+4EDMwpXpAnlRtuJu+vFozMLF2a0lXAfOowkbYxYe1+RF2Yhb2IT9MQv9eVHOxTGsSwxGcCZm4WdelLuSHg8QatGZeh5KyQtxB/NwCIfRgtt5US6IWbiJgZTTWZ/UrsG1xLQHL2IWeqrYd+dF2YdunMRVBMRaLMckXiVwK3r/I0E/tqXzW0xgdX0VYCrFOjO2Va+PuJTO4/iE8Xq8RhuWqdj2FAdxpDo7ZmEUF/KiXIwxrMJUvYqibSrTdx2nUeZFeRaX8SFm4Suk5PcYiVnYAtU2bkBHzMJgXpTNOIHtqfdeLMUS3Mcz7GFmkNbjHr6jK2ZhsJp+XpQt6ec6jKIB86cLJNA+9GFOamsAb1Qc+qJic2PSagzv/iqQirQn6mvS1SQ+Y0WawkXJjUcxC5uhdpbSw9iKLjzEt7QnE6QpxWmb/wA4250STmTc7QAAAABJRU5ErkJggg=="
  event_type: "doubletap"
  default_order: 10

module.exports =
  Model: DoubleTapTool
  View: DoubleTapToolView
