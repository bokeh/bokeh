import {SidePanel} from "core/layout/side_panel"
import {GuideRenderer} from "../renderers/guide_renderer"
import {RendererView} from "../renderers/renderer"

import {logger} from "core/logging"
import * as p from "core/properties"
import {isString, isArray} from "core/util/types"

export class AxisView extends RendererView
  initialize: (options) ->
    super(options)
    @_x_range_name = @model.x_range_name
    @_y_range_name = @model.y_range_name

  render: () ->
    if @model.visible == false
      return

    ctx = @plot_view.canvas_view.ctx
    ctx.save()
    @_draw_rule(ctx)
    @_draw_major_ticks(ctx)
    @_draw_minor_ticks(ctx)
    @_draw_major_labels(ctx)
    @_draw_axis_label(ctx)
    ctx.restore()

  bind_bokeh_events: () ->
    @listenTo(@model, 'change', @plot_view.request_render)

  _get_size: () ->
    return @_tick_extent() + @_tick_label_extent() + @_axis_label_extent()

  _draw_rule: (ctx) ->
    if not @visuals.axis_line.doit
      return
    [x, y] = coords = @model.rule_coords
    [sx, sy] = @plot_view.map_to_screen(x, y, @_x_range_name, @_y_range_name)
    [nx, ny] = @model.normals
    [xoff, yoff]  = @model.offsets
    @visuals.axis_line.set_value(ctx)
    ctx.beginPath()
    ctx.moveTo(Math.round(sx[0]+nx*xoff), Math.round(sy[0]+ny*yoff))
    for i in [1...sx.length]
      ctx.lineTo(Math.round(sx[i]+nx*xoff), Math.round(sy[i]+ny*yoff))
    ctx.stroke()

  _draw_major_ticks: (ctx) ->
    if not @visuals.major_tick_line.doit
      return
    coords = @model.tick_coords
    [x, y] = coords.major
    [sx, sy] = @plot_view.map_to_screen(x, y, @_x_range_name, @_y_range_name)
    [nx, ny] = @model.normals
    [xoff, yoff]  = @model.offsets

    tin = @model.major_tick_in
    tout = @model.major_tick_out
    @visuals.major_tick_line.set_value(ctx)
    for i in [0...sx.length]
      ctx.beginPath()
      ctx.moveTo(Math.round(sx[i]+nx*tout+nx*xoff), Math.round(sy[i]+ny*tout+ny*yoff))
      ctx.lineTo(Math.round(sx[i]-nx*tin+nx*xoff), Math.round(sy[i]-ny*tin+ny*yoff))
      ctx.stroke()

  _draw_minor_ticks: (ctx) ->
    if not @visuals.minor_tick_line.doit
      return
    coords = @model.tick_coords
    [x, y] = coords.minor
    [sx, sy] = @plot_view.map_to_screen(x, y, @_x_range_name, @_y_range_name)
    [nx, ny] = @model.normals
    [xoff, yoff]  = @model.offsets
    tin = @model.minor_tick_in
    tout = @model.minor_tick_out
    @visuals.minor_tick_line.set_value(ctx)
    for i in [0...sx.length]
      ctx.beginPath()
      ctx.moveTo(Math.round(sx[i]+nx*tout+nx*xoff), Math.round(sy[i]+ny*tout+ny*yoff))
      ctx.lineTo(Math.round(sx[i]-nx*tin+nx*xoff), Math.round(sy[i]-ny*tin+ny*yoff))
      ctx.stroke()

  _draw_major_labels: (ctx) ->
    coords = @model.tick_coords
    [x, y] = coords.major
    [sx, sy] = @plot_view.map_to_screen(x, y, @_x_range_name, @_y_range_name)
    [nx, ny] = @model.normals
    [xoff, yoff]  = @model.offsets
    dim = @model.dimension
    side = @model.panel_side
    orient = @model.major_label_orientation
    if isString(orient)
      angle = @model.panel.get_label_angle_heuristic(orient)
    else
      angle = -orient
    standoff = @_tick_extent() + @model.major_label_standoff

    labels = @model.formatter.doFormat(coords.major[dim], @model.loc)

    @visuals.major_label_text.set_value(ctx)
    @model.panel.apply_label_text_heuristics(ctx, orient)
    for i in [0...sx.length]
      if angle
        ctx.translate(sx[i]+nx*standoff+nx*xoff, sy[i]+ny*standoff+ny*yoff)
        ctx.rotate(angle)
        ctx.fillText(labels[i], 0, 0)
        ctx.rotate(-angle)
        ctx.translate(-sx[i]-nx*standoff+nx*xoff, -sy[i]-ny*standoff+ny*yoff)
      else
        ctx.fillText(labels[i], Math.round(sx[i]+nx*standoff+nx*xoff), Math.round(sy[i]+ny*standoff+ny*yoff))

  _draw_axis_label: (ctx) ->
    label = @model.axis_label
    if not label?
      return
    [x, y] = @model.rule_coords
    [sx, sy] = @plot_view.map_to_screen(x, y, @_x_range_name, @_y_range_name)
    [nx, ny] = @model.normals
    [xoff, yoff]  = @model.offsets
    side = @model.panel_side
    orient = 'parallel'
    angle = @model.panel.get_label_angle_heuristic(orient)
    standoff = (@_tick_extent() + @_tick_label_extent() + @model.axis_label_standoff)
    sx = (sx[0] + sx[sx.length-1])/2
    sy = (sy[0] + sy[sy.length-1])/2
    @visuals.axis_label_text.set_value(ctx)
    @model.panel.apply_label_text_heuristics(ctx, orient)

    x = sx+nx*standoff+nx*xoff
    y = sy+ny*standoff+ny*yoff

    if isNaN(x) or isNaN(y)
      return

    if angle
      ctx.translate(x, y)
      ctx.rotate(angle)
      ctx.fillText(label, 0, 0)
      ctx.rotate(-angle)
      ctx.translate(-x, -y)
    else
      ctx.fillText(label, x, y)

  _tick_extent: () ->
    return @model.major_tick_out

  _tick_label_extent: () ->
    extent = 0
    ctx = @plot_view.canvas_view.ctx

    dim = @model.dimension
    coords = @model.tick_coords.major
    side = @model.panel_side
    orient = @model.major_label_orientation
    labels = @model.formatter.doFormat(coords[dim], @model.loc)
    @visuals.major_label_text.set_value(ctx)

    if isString(orient)
      hscale = 1
      angle = @model.panel.get_label_angle_heuristic(orient)
    else
      hscale = 2
      angle = -orient
    angle = Math.abs(angle)
    c = Math.cos(angle)
    s = Math.sin(angle)
    if side == "above" or side == "below"
      wfactor = s
      hfactor = c
    else
      wfactor = c
      hfactor = s
    for i in [0...labels.length]
      if not labels[i]?
        continue
      w = ctx.measureText(labels[i]).width * 1.1
      h = ctx.measureText(labels[i]).ascent * 0.9
      val = w*wfactor + (h/hscale)*hfactor
      if val > extent
        extent = val
    if extent > 0
      extent += @model.major_label_standoff
    return extent

  _axis_label_extent: () ->
    extent = 0

    side = @model.panel_side
    axis_label = @model.axis_label
    orient = 'parallel'
    ctx = @plot_view.canvas_view.ctx
    @visuals.axis_label_text.set_value(ctx)
    angle = Math.abs(@model.panel.get_label_angle_heuristic(orient))
    c = Math.cos(angle)
    s = Math.sin(angle)
    if axis_label
      extent += @model.axis_label_standoff
      @visuals.axis_label_text.set_value(ctx)
      w = ctx.measureText(axis_label).width * 1.1
      h = ctx.measureText(axis_label).ascent * 0.9
      if side == "above" or side == "below"
        extent += w*s + h*c
      else
        extent += w*c + h*s
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
      bounds:         [ p.Any,      'auto'    ] # TODO (bev)
      ticker:         [ p.Instance, null      ]
      formatter:      [ p.Instance, null      ]
      x_range_name:   [ p.String,   'default' ]
      y_range_name:   [ p.String,   'default' ]
      axis_label:     [ p.String,   ''        ]
      axis_label_standoff:     [ p.Int,         5 ]
      major_label_standoff:    [ p.Int,         5 ]
      major_label_orientation: [ p.Any, "horizontal" ] # TODO: p.Orientation | p.Number
      major_tick_in:  [ p.Number,   2         ]
      major_tick_out: [ p.Number,   6         ]
      minor_tick_in:  [ p.Number,   0         ]
      minor_tick_out: [ p.Number,   4         ]
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

  initialize: (attrs, options)->
    super(attrs, options)

    @define_computed_property('computed_bounds', @_computed_bounds, false)
    @add_dependencies('computed_bounds', this, ['bounds'])
    @add_dependencies('computed_bounds', @plot, ['x_range', 'y_range'])

  @getters {
    computed_bounds: () -> @_get_computed('computed_bounds')
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
        yoff = Math.abs(@panel.top - frame.bottom)
      when "above"
        yoff = Math.abs(@panel.bottom - frame.top)
      when "right"
        xoff = Math.abs(@panel.left - frame.right)
      when "left"
        xoff = Math.abs(@panel.right - frame.left)

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

    if range.type == "FactorRange"
      for ii in [0...majors.length]
        coords[i].push(majors[ii])
        coords[j].push(@loc)
    else
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
