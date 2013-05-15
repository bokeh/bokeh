base = require('../../base')
HasParent = base.HasParent
safebind = base.safebind

properties = require('../properties')
line_properties = properties.line_properties
text_properties = properties.text_properties

PlotWidget = require('../../common/plot_widget').PlotWidget
ticking = require('../../common/ticking')

signum = (x) -> x ? x<0 ? -1:1:0


class LinearAxisView extends PlotWidget
  initialize: (attrs, options) ->
    super(attrs, options)

    guidespec = @mget('guidespec')
    @rule_props = new line_properties(@, guidespec, 'axis_')
    @major_tick_props = new line_properties(@, guidespec, 'major_tick_')
    @major_label_props = new text_properties(@, guidespec, 'major_label_')

  render: () ->

    ctx = @plot_view.ctx
    ctx.save()

    @_draw_rule(ctx)

    @_draw_major_ticks(ctx)

    @_draw_major_labels(ctx)

    ctx.restore()

  bind_bokeh_events: () ->
    safebind(this, @model, 'change', @request_render)

  _draw_rule: (ctx) ->
    [x, y] = @mget('rule_coords')
    [sx, sy] = @plot_view.map_to_screen(x, "data", y, "data")
    @rule_props.set(ctx, @)
    ctx.beginPath()
    ctx.moveTo(sx[0], sy[0])
    for i in [1..sx.length-1]
      ctx.lineTo(sx[i], sy[i])
    ctx.stroke()
    return

  _draw_major_ticks: (ctx) ->
    [x, y] = @mget('major_coords')
    [sx, sy] = @plot_view.map_to_screen(x, "data", y, "data")
    [nx, ny] = @mget('normals')
    tin = @mget('major_tick_in')
    tout = @mget('major_tick_out')
    @major_tick_props.set(ctx, @)
    for i in [0..sx.length-1]
      ctx.beginPath()
      ctx.moveTo(sx[i]+nx*tout, sy[i]+ny*tout)
      ctx.lineTo(sx[i]-nx*tin,  sy[i]-ny*tin)
      ctx.stroke()
    return

  _draw_major_labels: (ctx) ->
    [x, y] = coords = @mget('major_coords')
    [sx, sy] = @plot_view.map_to_screen(x, "data", y, "data")
    [nx, ny] = @mget('normals')
    standoff = @mget('major_label_standoff')
    @major_label_props.set(ctx, @)
    dim = @mget('guidespec').dimension
    formatter = new ticking.BasicTickFormatter()
    labels = formatter.format(coords[dim])
    for i in [0..sx.length-1]
      ctx.fillText(labels[i], sx[i] + nx*standoff, sy[i] + ny * standoff)
    return


class LinearAxis extends HasParent
  default_view: LinearAxisView
  type: 'GuideRenderer'

  initialize: (attrs, options)->
    super(attrs, options)

    @register_property('bounds', @_bounds, false)
    @add_dependencies('bounds', this, ['guidespec'])
    @add_dependencies('bounds', @get_obj('parent'), ['x_range', 'y_range'])

    @register_property('rule_coords', @_rule_coords, false)
    @add_dependencies('rule_coords', this, ['bounds', 'dimension', 'location'])

    @register_property('major_coords', @_major_coords, false)
    @add_dependencies('major_coords', this, ['bounds', 'dimension', 'location'])

    @register_property('normals', @_normals, false)
    @add_dependencies('normals', this, ['bounds', 'dimension', 'location'])

  _bounds: () ->
    i = @get('guidespec').dimension
    j = (i + 1) % 2

    ranges = [@get_obj('parent').get('x_range'), @get_obj('parent').get('y_range')]

    user_bounds = @get('guidespec').bounds ? 'auto'
    range_bounds = [ranges[i].get('min'), ranges[i].get('max')]

    if _.isArray(user_bounds)
      start = Math.min(user_bounds[0], user_bounds[1])
      end = Math.max(user_bounds[0], user_bounds[1])
      if start < range_bounds[0]
        start = range_bounds[0]
      else if start > range_bounds[1]
        start = null
      if end > range_bounds[1]
        end = range_bounds[1]
      else if end < range_bounds[0]
        end = null
    else
      [start, end] = range_bounds

    return [start, end]

  _rule_coords: () ->
    i = @get('guidespec').dimension
    j = (i + 1) % 2

    ranges = [@get_obj('parent').get('x_range'), @get_obj('parent').get('y_range')]
    range = ranges[i]
    cross_range = ranges[j]

    [start, end] = @get('bounds')

    xs = new Array(2)
    ys = new Array(2)
    coords = [xs, ys]

    loc = @get('guidespec').location
    if _.isString(loc)
      if loc == 'left' or loc == 'bottom'
        loc = 'start'
      else if loc == 'right' or loc == 'top'
        loc = 'end'
      loc = cross_range.get(loc)

    coords[i][0] = start
    coords[i][1] = end
    coords[j][0] = loc
    coords[j][1] = loc

    return coords

  _major_coords: () ->
    i = @get('guidespec').dimension
    j = (i + 1) % 2

    ranges = [@get_obj('parent').get('x_range'), @get_obj('parent').get('y_range')]
    range = ranges[i]
    cross_range = ranges[j]

    [start, end] = @get('bounds')

    tmp = Math.min(start, end)
    end = Math.max(start, end)
    start = tmp

    [imin, imax, interval] = ticking.auto_interval(start, end)
    ticks = ticking.auto_ticks(null, null, start, end, interval)

    loc = @get('guidespec').location
    if _.isString(loc)
      if loc == 'left' or loc == 'bottom'
        loc = 'start'
      else if loc == 'right' or loc == 'top'
        loc = 'end'
      loc = cross_range.get(loc)

    xs = []
    ys = []
    coords = [xs, ys]

    for ii in [0..ticks.length-1]
      coords[i].push(ticks[ii])
      coords[j].push(loc)

    return coords

  _normals: () ->
    i = @get('guidespec').dimension
    j = (i + 1) % 2

    ranges = [@get_obj('parent').get('x_range'), @get_obj('parent').get('y_range')]
    range = ranges[i]
    cross_range = ranges[j]

    [start, end] = @get('bounds')

    loc = @get('guidespec').location
    cstart = cross_range.get('start')
    cend = cross_range.get('end')

    normals = [0, 0]

    if _.isString(loc)
      normals[j] = if (end-start) < 0 then -1 else 1
      if i == 0
        if (loc == 'max' and (cstart < cend)) or (loc == 'min' and (cstart > cend)) or loc == 'right' or loc == 'top'
          normals[j] *= -1
      else if i == 1
        if (loc == 'min' and (cstart < cend)) or (loc == 'max' and (cstart > cend)) or loc == 'left' or loc == 'bottom'
          normals[j] *= -1

    else
      if i == 0
        if Math.abs(loc-cstart) <= Math.abs(loc-cend)
          normals[j] = 1
        else
          normals[j] = -1
      else
        if Math.abs(loc-cstart) <= Math.abs(loc-cend)
          normals[j] = -1
        else
          normals[j] = 1
    return normals


LinearAxis::defaults = _.clone(LinearAxis::defaults)


LinearAxis::display_defaults = _.clone(LinearAxis::display_defaults)
_.extend(LinearAxis::display_defaults, {

  level: 'overlay'

  axis_line_color: 'black'
  axis_line_width: 1
  axis_line_alpha: 1.0
  axis_line_join: 'miter'
  axis_line_cap: 'butt'
  axis_line_dash: []
  axis_line_dash_offset: 0

  major_tick_in: 2
  major_tick_out: 4
  major_tick_line_color: 'black'
  major_tick_line_width: 1
  major_tick_line_alpha: 1.0
  major_tick_line_join: 'miter'
  major_tick_line_cap: 'butt'
  major_tick_line_dash: []
  major_tick_line_dash_offset: 0

  major_label_standoff: 15
  major_label_text_font: "helvetica"
  major_label_text_font_size: "10pt"
  major_label_text_font_style: "normal"
  major_label_text_color: "#444444"
  major_label_text_alpha: 1.0
  major_label_text_align: "center"
  major_label_text_baseline: "middle"

})


exports.LinearAxis = LinearAxis
exports.LinearAxisView = LinearAxisView

