scale_range = ({frame, factor, center, h_axis_only = false, v_axis_only = false}) ->
  # Util for Tools to Scale ranges of a frame for use by PlotCanvasView.update_range()
  #
  # Parameters:
  # * frame
  # * factor      - scaling factor (clamped: -0.9 < args.factor < 0.9)
  # * center      - center point for scaling
  # * v_axis_only - if true only scale the vertical axis
  # * h_axis_only - if true only scale the horizontal axis

  hr = frame.get('h_range')
  vr = frame.get('v_range')


  # clamp the  magnitude of factor, if it is > 1 bad things happen
  if factor > 0.9
    factor = 0.9
  else if factor < -0.9
    factor = -0.9

  vx_low  = hr.get('start')
  vx_high = hr.get('end')

  vy_low  = vr.get('start')
  vy_high = vr.get('end')

  frame_center = {
    x: (vx_high + vx_low) / 2.0
    y: (vy_high + vy_low) / 2.0
  }


  # if center or either dimension center.x,y
  # isn't given, use the frame_center
  vx = center?.x ? frame_center.x
  vy = center?.y ? frame_center.y


  if vx < vx_low or vx > vx_high
    v_axis_only = true
  if vy < vy_low or vy > vy_high
    h_axis_only = true

  if not v_axis_only
    sx0 = vx_low  - (vx_low  - vx)*factor
    sx1 = vx_high - (vx_high - vx)*factor
  else
    sx0 = vx_low
    sx1 = vx_high

  if not h_axis_only
    sy0 = vy_low  - (vy_low  - vy)*factor
    sy1 = vy_high - (vy_high - vy)*factor
  else
    sy0 = vy_low
    sy1 = vy_high

  xrs = {}
  for name, mapper of frame.get('x_mappers')
    [start, end] = mapper.v_map_from_target([sx0, sx1], true)
    xrs[name] = {start: start, end: end}

  yrs = {}
  for name, mapper of frame.get('y_mappers')
    [start, end] = mapper.v_map_from_target([sy0, sy1], true)
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

module.exports = {
    scale_range: scale_range
}
