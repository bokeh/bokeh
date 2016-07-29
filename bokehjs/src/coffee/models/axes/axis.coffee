_ = require "underscore"

SidePanel = require "../../core/layout/side_panel"
GuideRenderer = require "../renderers/guide_renderer"
Renderer = require "../renderers/renderer"

{GE} = require "../../core/layout/solver"
{logger} = require "../../core/logging"
p = require "../../core/properties"

class AxisView extends Renderer.View
  initialize: (options) ->
    super(options)
    @_x_range_name = @mget('x_range_name')
    @_y_range_name = @mget('y_range_name')

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
    [x, y] = coords = @mget('rule_coords')
    [sx, sy] = @plot_view.map_to_screen(x, y, @_x_range_name, @_y_range_name)
    [nx, ny] = @mget('normals')
    [xoff, yoff]  = @mget('offsets')
    @visuals.axis_line.set_value(ctx)
    ctx.beginPath()
    ctx.moveTo(Math.round(sx[0]+nx*xoff), Math.round(sy[0]+ny*yoff))
    for i in [1...sx.length]
      ctx.lineTo(Math.round(sx[i]+nx*xoff), Math.round(sy[i]+ny*yoff))
    ctx.stroke()

  _draw_major_ticks: (ctx) ->
    if not @visuals.major_tick_line.doit
      return
    coords = @mget('tick_coords')
    [x, y] = coords.major
    [sx, sy] = @plot_view.map_to_screen(x, y, @_x_range_name, @_y_range_name)
    [nx, ny] = @mget('normals')
    [xoff, yoff]  = @mget('offsets')

    tin = @mget('major_tick_in')
    tout = @mget('major_tick_out')
    @visuals.major_tick_line.set_value(ctx)
    for i in [0...sx.length]
      ctx.beginPath()
      ctx.moveTo(Math.round(sx[i]+nx*tout+nx*xoff), Math.round(sy[i]+ny*tout+ny*yoff))
      ctx.lineTo(Math.round(sx[i]-nx*tin+nx*xoff), Math.round(sy[i]-ny*tin+ny*yoff))
      ctx.stroke()

  _draw_minor_ticks: (ctx) ->
    if not @visuals.minor_tick_line.doit
      return
    coords = @mget('tick_coords')
    [x, y] = coords.minor
    [sx, sy] = @plot_view.map_to_screen(x, y, @_x_range_name, @_y_range_name)
    [nx, ny] = @mget('normals')
    [xoff, yoff]  = @mget('offsets')
    tin = @mget('minor_tick_in')
    tout = @mget('minor_tick_out')
    @visuals.minor_tick_line.set_value(ctx)
    for i in [0...sx.length]
      ctx.beginPath()
      ctx.moveTo(Math.round(sx[i]+nx*tout+nx*xoff), Math.round(sy[i]+ny*tout+ny*yoff))
      ctx.lineTo(Math.round(sx[i]-nx*tin+nx*xoff), Math.round(sy[i]-ny*tin+ny*yoff))
      ctx.stroke()

  _draw_major_labels: (ctx) ->
    coords = @mget('tick_coords')
    [x, y] = coords.major
    [sx, sy] = @plot_view.map_to_screen(x, y, @_x_range_name, @_y_range_name)
    [nx, ny] = @mget('normals')
    [xoff, yoff]  = @mget('offsets')
    dim = @mget('dimension')
    side = @mget('panel_side')
    orient = @mget('major_label_orientation')
    if _.isString(orient)
      angle = @model.panel.get_label_angle_heuristic(orient)
    else
      angle = -orient
    standoff = @_tick_extent() + @mget('major_label_standoff')
    labels = @mget('formatter').doFormat(coords.major[dim])

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
    label = @mget('axis_label')
    if not label?
      return
    [x, y] = @mget('rule_coords')
    [sx, sy] = @plot_view.map_to_screen(x, y, @_x_range_name, @_y_range_name)
    [nx, ny] = @mget('normals')
    [xoff, yoff]  = @mget('offsets')
    side = @mget('panel_side')
    orient = 'parallel'
    angle = @model.panel.get_label_angle_heuristic(orient)
    standoff = (@_tick_extent() + @_tick_label_extent() + @mget('axis_label_standoff'))
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
    return @mget('major_tick_out')

  _tick_label_extent: () ->
    extent = 0
    ctx = @plot_view.canvas_view.ctx

    dim = @mget('dimension')
    coords = @mget('tick_coords').major
    side = @mget('panel_side')
    orient = @mget('major_label_orientation')
    labels = @mget('formatter').doFormat(coords[dim])
    @visuals.major_label_text.set_value(ctx)

    if _.isString(orient)
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
      extent += @mget('major_label_standoff')
    return extent

  _axis_label_extent: () ->
    extent = 0

    side = @mget('panel_side')
    axis_label = @mget('axis_label')
    orient = 'parallel'
    ctx = @plot_view.canvas_view.ctx
    @visuals.axis_label_text.set_value(ctx)
    angle = Math.abs(@model.panel.get_label_angle_heuristic(orient))
    c = Math.cos(angle)
    s = Math.sin(angle)
    if axis_label
      extent += @mget('axis_label_standoff')
      @visuals.axis_label_text.set_value(ctx)
      w = ctx.measureText(axis_label).width * 1.1
      h = ctx.measureText(axis_label).ascent * 0.9
      if side == "above" or side == "below"
        extent += w*s + h*c
      else
        extent += w*c + h*s
    return extent


class Axis extends GuideRenderer.Model
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
    @add_dependencies('computed_bounds', @get('plot'), ['x_range', 'y_range'])

    @define_computed_property('rule_coords', @_rule_coords, false)
    @add_dependencies('rule_coords', this, ['computed_bounds', 'side'])

    @define_computed_property('tick_coords', @_tick_coords, false)
    @add_dependencies('tick_coords', this, ['computed_bounds', 'panel_side'])

    @define_computed_property('ranges', @_ranges, true)
    @define_computed_property('normals', (() -> @panel._normals), true)
    @define_computed_property('dimension', (() -> @panel._dim), true)
    @define_computed_property('offsets', @_offsets, true)

  add_panel: (side) ->
    @panel = new SidePanel.Model({side: side})
    @panel.attach_document(@document)
    @set('panel_side', side)

  _offsets: () ->
    side = @get('panel_side')
    [xoff, yoff] = [0, 0]
    frame = @plot.plot_canvas.get('frame')

    if side == "below"
      yoff = Math.abs(@panel.get("top") - frame.get("bottom"))

    else if side == "above"
      yoff = Math.abs(@panel.get("bottom") - frame.get("top"))

    else if side == "right"
      xoff = Math.abs(@panel.get("left") - frame.get("right"))

    else if side == "left"
      xoff = Math.abs(@panel.get("right") - frame.get("left"))

    return [xoff, yoff]

  _ranges: () ->
    i = @get('dimension')
    j = (i + 1) % 2
    frame = @plot.plot_canvas.get('frame')
    ranges = [
      frame.get('x_ranges')[@get('x_range_name')],
      frame.get('y_ranges')[@get('y_range_name')]
    ]
    return [ranges[i], ranges[j]]

  _computed_bounds: () ->
    [range, cross_range] = @get('ranges')

    user_bounds = @get('bounds') ? 'auto'
    range_bounds = [range.get('min'), range.get('max')]

    if user_bounds == 'auto'
      return range_bounds

    if _.isArray(user_bounds)
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
    i = @get('dimension')
    j = (i + 1) % 2
    [range, cross_range] = @get('ranges')
    [start, end] = @get('computed_bounds')

    xs = new Array(2)
    ys = new Array(2)
    coords = [xs, ys]

    loc = @_get_loc(cross_range)

    coords[i][0] = Math.max(start, range.get('min'))
    coords[i][1] = Math.min(end, range.get('max'))
    if coords[i][0] > coords[i][1]
      coords[i][0] = coords[i][1] = NaN

    coords[j][0] = loc
    coords[j][1] = loc

    return coords

  _tick_coords: () ->
    i = @get('dimension')
    j = (i + 1) % 2
    [range, cross_range] = @get('ranges')
    [start, end] = @get('computed_bounds')

    ticks = @get('ticker').get_ticks(start, end, range, {})
    majors = ticks.major
    minors = ticks.minor

    loc = @_get_loc(cross_range)

    xs = []
    ys = []
    coords = [xs, ys]

    minor_xs = []
    minor_ys = []
    minor_coords = [minor_xs, minor_ys]

    if range.type == "FactorRange"
      for ii in [0...majors.length]
        coords[i].push(majors[ii])
        coords[j].push(loc)
    else
      [range_min, range_max] = [range.get('min'), range.get('max')]

      for ii in [0...majors.length]
        if majors[ii] < range_min or majors[ii] > range_max
          continue
        coords[i].push(majors[ii])
        coords[j].push(loc)

      for ii in [0...minors.length]
        if minors[ii] < range_min or minors[ii] > range_max
          continue
        minor_coords[i].push(minors[ii])
        minor_coords[j].push(loc)

    return {
      "major": coords,
      "minor": minor_coords
    }

  _get_loc: (cross_range) ->
    cstart = cross_range.get('start')
    cend = cross_range.get('end')
    side = @get('panel_side')

    if side == 'left' or side == 'below'
      loc = 'start'
    else if side == 'right' or side == 'above'
      loc = 'end'

    return cross_range.get(loc)

module.exports =
  Model: Axis
  View: AxisView
