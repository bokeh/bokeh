import {SidePanel} from "core/layout/side_panel"
import {GuideRenderer} from "../renderers/guide_renderer"
import {RendererView} from "../renderers/renderer"

import {logger} from "core/logging"
import * as p from "core/properties"
import {sum} from "core/util/array"
import {isString, isArray} from "core/util/types"

export class AxisView extends RendererView

  render: () ->
    if @model.visible == false
      return

    extents = {
      tick: @_tick_extent(),
      tick_label: @_tick_label_extents(),
      axis_label: @_axis_label_extent()
    }
    tick_coords  = @model.tick_coords

    ctx = @plot_view.canvas_view.ctx
    ctx.save()

    @_draw_rule(ctx, extents)
    @_draw_major_ticks(ctx, extents, tick_coords)
    @_draw_minor_ticks(ctx, extents, tick_coords)
    @_draw_major_labels(ctx, extents, tick_coords)
    @_draw_axis_label(ctx, extents, tick_coords)

    if @_render?
      @_render(ctx, extents, tick_coords)

    ctx.restore()

  connect_signals: () ->
    super()
    @connect(@model.change, () => @plot_view.request_render())

  _get_size: () ->
    return @_tick_extent() + @_tick_label_extent() + @_axis_label_extent()

  get_size: () ->
    return if this.model.visible then Math.round(this._get_size()) else 0

  # drawing sub functions -----------------------------------------------------

  _draw_rule: (ctx, extents, tick_coords) ->
    if not @visuals.axis_line.doit
      return

    [x, y]       = @model.rule_coords
    [sx, sy]     = @plot_view.map_to_screen(x, y, @model.x_range_name, @model.y_range_name)
    [nx, ny]     = @model.normals
    [xoff, yoff] = @model.offsets

    @visuals.axis_line.set_value(ctx)

    ctx.beginPath()
    ctx.moveTo(Math.round(sx[0] + nx*xoff), Math.round(sy[0] + ny*yoff))
    for i in [1...sx.length]
      sx = Math.round(sx[i] + nx*xoff)
      sy = Math.round(sy[i] + ny*yoff)
      ctx.lineTo(sx, sy)
    ctx.stroke()

    return

  _draw_major_ticks: (ctx, extents, tick_coords) ->
    tin     = @model.major_tick_in
    tout    = @model.major_tick_out
    visuals = @visuals.major_tick_line

    @_draw_ticks(ctx, tick_coords.major, tin, tout, visuals)

    return

  _draw_minor_ticks: (ctx, extents, tick_coords) ->
    tin     = @model.minor_tick_in
    tout    = @model.minor_tick_out
    visuals = @visuals.minor_tick_line

    @_draw_ticks(ctx, tick_coords.minor, tin, tout, visuals)

    return

  _draw_major_labels: (ctx, extents, tick_coords) ->
    coords   = tick_coords.major
    labels   = @model.compute_labels(coords[@model.dimension])
    orient   = @model.major_label_orientation
    standoff = extents.tick + @model.major_label_standoff
    visuals  = @visuals.major_label_text

    @_draw_oriented_labels(ctx, labels, coords, orient, @model.panel_side, standoff, visuals)

    return

  _draw_axis_label: (ctx, extents, tick_coords) ->
    if not @model.axis_label? or @model.axis_label.length == 0
      return

    switch @model.panel.side
      when "above"
        sx = @model.panel._hcenter.value
        sy = @model.panel._bottom.value
      when "below"
        sx = @model.panel._hcenter.value
        sy = @model.panel._top.value
      when "left"
        sx = @model.panel._right.value
        sy = @model.panel._vcenter._value
      when "right"
        sx = @model.panel._left.value
        sy = @model.panel._vcenter._value

    coords = [[sx], [sy]]
    standoff = extents.tick + sum(extents.tick_label) + @model.axis_label_standoff
    visuals  = @visuals.axis_label_text

    @_draw_oriented_labels(ctx, [@model.axis_label], coords, 'parallel', @model.panel_side, standoff, visuals, "screen")

    return

  _draw_ticks: (ctx, coords, tin, tout, visuals) ->
    if not visuals.doit or coords.length == 0
      return

    [x, y]       = coords
    [sxs, sys]   = @plot_view.map_to_screen(x, y, @model.x_range_name, @model.y_range_name)
    [nx, ny]     = @model.normals
    [xoff, yoff] = @model.offsets

    [nxin,  nyin]  = [nx * (xoff-tin),  ny * (yoff-tin)]
    [nxout, nyout] = [nx * (xoff+tout), ny * (yoff+tout)]

    visuals.set_value(ctx)

    for i in [0...sxs.length]
      sx0 = Math.round(sxs[i] + nxout)
      sy0 = Math.round(sys[i] + nyout)
      sx1 = Math.round(sxs[i] + nxin)
      sy1 = Math.round(sys[i] + nyin)
      ctx.beginPath()
      ctx.moveTo(sx0, sy0)
      ctx.lineTo(sx1, sy1)
      ctx.stroke()

    return

  _draw_oriented_labels: (ctx, labels, coords, orient, side, standoff, visuals, units="data") ->
    if not visuals.doit or labels.length == 0
      return

    if units == "screen"
      [sxs, sys] = coords
      [xoff, yoff] = [0, 0]
    else
      [dxs, dys] = coords
      [sxs, sys] = @plot_view.map_to_screen(dxs, dys, @model.x_range_name, @model.y_range_name)
      [xoff, yoff] = @model.offsets

    [nx, ny] = @model.normals

    nxd = nx * (xoff + standoff)
    nyd = ny * (yoff + standoff)

    visuals.set_value(ctx)
    @model.panel.apply_label_text_heuristics(ctx, orient)

    if isString(orient)
      angle = @model.panel.get_label_angle_heuristic(orient)
    else
      angle = -orient

    for i in [0...sxs.length]
      sx = Math.round(sxs[i] + nxd)
      sy = Math.round(sys[i] + nyd)

      ctx.translate(sx, sy)
      ctx.rotate(angle)
      ctx.fillText(labels[i], 0, 0)
      ctx.rotate(-angle)
      ctx.translate(-sx, -sy)

    return

  # extents sub functions -----------------------------------------------------

  _axis_label_extent: () ->
    if not @model.axis_label? or @model.axis_label == ""
      return 0
    standoff = @model.axis_label_standoff
    visuals = @visuals.axis_label_text
    @_oriented_labels_extent([@model.axis_label], "parallel", @model.panel_side, standoff, visuals)

  _tick_extent: () ->
    return @model.major_tick_out

  _tick_label_extent: () ->
    return sum(@_tick_label_extents())

  _tick_label_extents: () ->
    coords = @model.tick_coords.major
    labels = @model.compute_labels(coords[@model.dimension])

    orient = @model.major_label_orientation
    standoff = @model.major_label_standoff
    visuals = @visuals.major_label_text

    return [@_oriented_labels_extent(labels, orient, @model.panel_side, standoff, visuals)]

  _tick_label_extent: () ->
    return sum(@_tick_label_extents())

  _oriented_labels_extent: (labels, orient, side, standoff, visuals) ->
    if labels.length == 0
      return 0

    ctx = @plot_view.canvas_view.ctx
    visuals.set_value(ctx)

    if isString(orient)
      hscale = 1
      angle = @model.panel.get_label_angle_heuristic(orient)
    else
      hscale = 2
      angle = -orient
    angle = Math.abs(angle)

    c = Math.cos(angle)
    s = Math.sin(angle)

    extent = 0

    for i in [0...labels.length]
      w = ctx.measureText(labels[i]).width * 1.1
      h = ctx.measureText(labels[i]).ascent * 0.9

      if side == "above" or side == "below"
        val = w*s + (h/hscale)*c
      else
        val = w*c + (h/hscale)*s

      # update extent if current value is larger
      if val > extent
        extent = val

    # only apply the standoff if we already have non-zero extent
    if extent > 0
      extent += standoff

    return extent

export class Axis extends GuideRenderer
  default_view: AxisView

  type: 'Axis'

  @mixins [
    'line:axis_',
    'line:major_tick_',
    'line:minor_tick_',
    'text:major_label_',
    'text:axis_label_'
  ]

  @define {
    bounds:                  [ p.Any,      'auto'       ] # TODO (bev)
    ticker:                  [ p.Instance, null         ]
    formatter:               [ p.Instance, null         ]
    x_range_name:            [ p.String,   'default'    ]
    y_range_name:            [ p.String,   'default'    ]
    axis_label:              [ p.String,   ''           ]
    axis_label_standoff:     [ p.Int,      5            ]
    major_label_standoff:    [ p.Int,      5            ]
    major_label_orientation: [ p.Any,      "horizontal" ] # TODO: p.Orientation | p.Number
    major_label_overrides:   [ p.Any,      {}           ]
    major_tick_in:           [ p.Number,   2            ]
    major_tick_out:          [ p.Number,   6            ]
    minor_tick_in:           [ p.Number,   0            ]
    minor_tick_out:          [ p.Number,   4            ]
  }

  @override {
    axis_line_color: 'black'

    major_tick_line_color: 'black'
    minor_tick_line_color: 'black'

    major_label_text_font_size: "8pt"
    major_label_text_align: "center"
    major_label_text_baseline: "alphabetic"

    axis_label_text_font_size: "10pt"
    axis_label_text_font_style: "italic"
  }

  @internal {
    panel_side: [ p.Any ]
  }

  compute_labels: (ticks) ->
    labels = @formatter.doFormat(ticks, @)
    for i in [0...ticks.length]
      if ticks[i] of @major_label_overrides
        labels[i] = @major_label_overrides[ticks[i]]
    return labels

  label_info: (coords) ->
    orient = @major_label_orientation
    info = {
      dim: @dimension
      coords: coords
      side: @panel_side
      orient: orient
      standoff: @major_label_standoff
    }
    return info

  @getters {
    computed_bounds: () -> @_computed_bounds()
    rule_coords: () -> @_rule_coords()
    tick_coords: () -> @_tick_coords()
    ranges: () -> @_ranges()
    normals: () -> @panel._normals
    dimension: () -> @panel._dim
    offsets: () -> @_offsets()
    loc: () ->@_get_loc()
  }

  add_panel: (side) ->
    @panel = new SidePanel({side: side})
    @panel.attach_document(@document)
    @panel_side = side

  _offsets: () ->
    side = @panel_side
    [xoff, yoff] = [0, 0]
    frame = @plot.plot_canvas.frame

    switch side
      when "below"
        yoff = Math.abs(@panel._top.value - frame._bottom.value)
      when "above"
        yoff = Math.abs(@panel._bottom.value - frame._top.value)
      when "right"
        xoff = Math.abs(@panel._left.value - frame._right.value)
      when "left"
        xoff = Math.abs(@panel._right.value - frame._left.value)

    return [xoff, yoff]

  _ranges: () ->
    i = @dimension
    j = (i + 1) % 2
    frame = @plot.plot_canvas.frame
    ranges = [
      frame.x_ranges[@x_range_name],
      frame.y_ranges[@y_range_name]
    ]
    return [ranges[i], ranges[j]]

  _computed_bounds: () ->
    [range, cross_range] = @ranges

    user_bounds = @bounds ? 'auto'
    range_bounds = [range.min, range.max]

    if user_bounds == 'auto'
      return range_bounds

    if isArray(user_bounds)
      if Math.abs(user_bounds[0]-user_bounds[1]) >
                  Math.abs(range_bounds[0]-range_bounds[1])
        start = Math.max(Math.min(user_bounds[0], user_bounds[1]),
                         range_bounds[0])
        end = Math.min(Math.max(user_bounds[0], user_bounds[1]),
                       range_bounds[1])
      else
        start = Math.min(user_bounds[0], user_bounds[1])
        end = Math.max(user_bounds[0], user_bounds[1])
      return [start, end]

    logger.error("user bounds '#{ user_bounds }' not understood")
    return null

  _rule_coords: () ->
    i = @dimension
    j = (i + 1) % 2
    [range, cross_range] = @ranges
    [start, end] = @computed_bounds

    xs = new Array(2)
    ys = new Array(2)
    coords = [xs, ys]

    coords[i][0] = Math.max(start, range.min)
    coords[i][1] = Math.min(end, range.max)
    if coords[i][0] > coords[i][1]
      coords[i][0] = coords[i][1] = NaN

    coords[j][0] = @loc
    coords[j][1] = @loc

    return coords

  _tick_coords: () ->
    i = @dimension
    j = (i + 1) % 2
    [range, cross_range] = @ranges
    [start, end] = @computed_bounds

    ticks = @ticker.get_ticks(start, end, range, @loc, {})
    majors = ticks.major
    minors = ticks.minor

    xs = []
    ys = []
    coords = [xs, ys]

    minor_xs = []
    minor_ys = []
    minor_coords = [minor_xs, minor_ys]

    [range_min, range_max] = [range.min, range.max]

    for ii in [0...majors.length]
      if majors[ii] < range_min or majors[ii] > range_max
        continue
      coords[i].push(majors[ii])
      coords[j].push(@loc)

    for ii in [0...minors.length]
      if minors[ii] < range_min or minors[ii] > range_max
        continue
      minor_coords[i].push(minors[ii])
      minor_coords[j].push(@loc)

    return {
      "major": coords,
      "minor": minor_coords
    }

  _get_loc: () ->
    [range, cross_range] = @ranges
    cstart = cross_range.start
    cend = cross_range.end
    side = @panel_side

    return switch side
      when 'left', 'below' then cross_range.start
      when 'right', 'above' then cross_range.end
