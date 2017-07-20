import {clamp} from "./math"

# Module for zoom-related functions

export scale_highlow = (range, factor, center=null) ->
  [low, high] = [range.start, range.end]
  x = if center? then center else (high + low) / 2.0
  x0 = low - (low - x) * factor
  x1 = high - (high - x) * factor
  return [x0, x1]

export get_info = (scales, [x0, x1]) ->
  info = {}
  for name, scale of scales
    [start, end] = scale.v_invert([x0, x1])
    info[name] = {start: start, end: end}
  return info

export scale_range = (frame, factor, h_axis=true, v_axis=true, center=null) ->
  """
  Utility function for zoom tools to calculate/create the zoom_info object
  of the form required by ``PlotCanvasView.update_range``

  Parameters:
    frame : CartesianFrame
    factor : Number
    h_axis : Boolean, optional
      whether to zoom the horizontal axis (default = true)
    v_axis : Boolean, optional
      whether to zoom the horizontal axis (default = true)
    center : object, optional
      of form {'x': Number, 'y', Number}

  Returns:
    object:
  """

  # clamp the  magnitude of factor, if it is > 1 bad things happen
  factor = clamp(factor, -0.9, 0.9)

  hfactor = if h_axis then factor else 0
  [vx0, vx1] = scale_highlow(frame.h_range, hfactor, center?.x)
  xrs = get_info(frame.xscales, [vx0, vx1])

  vfactor = if v_axis then factor else 0
  [vy0, vy1] = scale_highlow(frame.v_range, vfactor, center?.y)
  yrs = get_info(frame.yscales, [vy0, vy1])

  # OK this sucks we can't set factor independently in each direction. It is used
  # for GMap plots, and GMap plots always preserve aspect, so effective the value
  # of 'dimensions' is ignored.
  return {
    xrs: xrs
    yrs: yrs
    factor: factor
  }
