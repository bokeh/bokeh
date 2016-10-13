# Module for zoom-related functions

export scale_range = (frame, factor, h_axis=true, v_axis=true, center=null) ->
  """
  Utility function for zoom tools to calculate/create the zoom_info object
  of the form required by ``PlotCanvasView.update_range``

  Parameters:
    frame : CartesianFrame
    factor : Number
    center : object, optional
      of form {'x': Number, 'y', Number}
    h_axis : Boolean, optional
      whether to zoom the horizontal axis (default = true)
    v_axis : Boolean, optional
      whether to zoom the horizontal axis (default = true)

  Returns:
    object:
  """

  hr = frame.h_range
  vr = frame.v_range

  # clamp the  magnitude of factor, if it is > 1 bad things happen
  if factor > 0.9
    factor = 0.9
  else if factor < -0.9
    factor = -0.9

  [vx_low, vx_high] = [hr.start, hr.end]
  [vy_low, vy_high] = [vr.start, vr.end]

  vx = if center? then center.x else (vx_high + vx_low) / 2.0
  vy = if center? then center.y else (vy_high + vy_low) / 2.0

  if h_axis
    sx0 = vx_low  - (vx_low  - vx)*factor
    sx1 = vx_high - (vx_high - vx)*factor
  else
    sx0 = vx_low
    sx1 = vx_high

  if v_axis
    sy0 = vy_low  - (vy_low  - vy)*factor
    sy1 = vy_high - (vy_high - vy)*factor
  else
    sy0 = vy_low
    sy1 = vy_high

  xrs = {}
  for name, mapper of frame.x_mappers
    [start, end] = mapper.v_map_from_target([sx0, sx1])
    xrs[name] = {start: start, end: end}

  yrs = {}
  for name, mapper of frame.y_mappers
    [start, end] = mapper.v_map_from_target([sy0, sy1])
    yrs[name] = {start: start, end: end}

  # OK this sucks we can't set factor independently in each direction. It is used
  # for GMap plots, and GMap plots always preserve aspect, so effective the value
  # of 'dimensions' is ignored.
  zoom_info = {
    xrs: xrs
    yrs: yrs
    factor: factor
  }
  return zoom_info
