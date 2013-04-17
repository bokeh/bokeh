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

    @rule_props = new line_properties(@, {}, 'rule_')
    @major_tick_props = new line_properties(@, {}, 'major_tick_')
    @major_label_props = new text_properties(@, {}, 'major_label_')

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
    dim = @mget('dimension')
    for i in [0..sx.length-1]
      ctx.fillText("#{coords[dim][i]}", sx[i] + nx*standoff, sy[i] + ny * standoff)
    return


class LinearAxis extends HasParent
  default_view: LinearAxisView
  type: 'GuideRenderer'

  initialize: (attrs, options)->
    super(attrs, options)

    @register_property('rule_coords', @_rule_coords, false)
    @add_dependencies('rule_coords', this, ['bounds', 'dimension', 'location'])

    @register_property('major_coords', @_major_coords, false)
    @add_dependencies('major_coords', this, ['bounds', 'dimension', 'location'])

    @register_property('normals', @_normals, false)
    @add_dependencies('normals', this, ['dimension', 'location'])

  _rule_coords: () ->
    bounds = @get_obj('bounds')
    if _.isArray(bounds)
      start = bounds[0]
      end = bounds[1]
    else
      start = bounds.get('start')
      end = bounds.get('end')

    dim = @get('dimension')

    xs = new Array(2)
    ys = new Array(2)
    coords = [xs, ys]

    loc = @get('location')
    if _.isString(loc)
      loc = @get_obj('cross_range').get(loc)

    i = @get('dimension')
    j = (i + 1) % 2

    coords[i][0] = start
    coords[i][1] = end
    coords[j][0] = loc
    coords[j][1] = loc

    return coords

  _major_coords: () ->
    bounds = @get_obj('bounds')
    if _.isArray(bounds)
      start = bounds[0]
      end = bounds[1]
    else
      start = bounds.get('start')
      end = bounds.get('end')

    tmp = Math.min(start, end)
    end = Math.max(start, end)
    start = tmp

    interval = ticking.auto_interval(start, end)
    [first_tick, last_tick] = ticking.auto_bounds(start, end, interval)

    i = @get('dimension')
    j = (i + 1) % 2

    loc = @get('location')
    if _.isString(loc)
      loc = @get_obj('cross_range').get(loc)

    xs = []
    ys = []
    coords = [xs, ys]

    current_tick = first_tick
    while current_tick <= last_tick
      coords[i].push(current_tick)
      coords[j].push(loc)
      current_tick += interval

    return coords

  _normals: () ->
    bounds = @get_obj('bounds')
    if _.isArray(bounds)
      start = bounds[0]
      end = bounds[1]
    else
      start = bounds.get('start')
      end = bounds.get('end')

    i = @get('dimension')
    j = (i + 1) % 2

    loc = @get('location')

    cstart = @get_obj('cross_range').get('start')
    cend = @get_obj('cross_range').get('end')

    normals = [0, 0]

    d = end - start
    normals[j] = if d<0 then -1 else 1

    if i == 0
      if (loc == 'max' and (cstart < cend)) or (loc == 'max' and (cstart > cend)) or loc == 'right' or loc == 'bottom'
        normals[j] *= -1
    else if i == 1
      if (loc == 'min' and (cstart < cend)) or (loc == 'min' and (cstart > cend)) or loc == 'left' or loc == 'top'
        normals[j] *= -1

    return normals


LinearAxis::defaults = _.clone(LinearAxis::defaults)


LinearAxis::display_defaults = _.clone(LinearAxis::display_defaults)
_.extend(LinearAxis::display_defaults, {

  level: 'overlay'

  rule_line_color: 'black'
  rule_line_width: 2
  rule_line_alpha: 1.0
  rule_line_join: 'miter'
  rule_line_cap: 'butt'
  rule_line_dash: []
  rule_line_dash_offset: 0

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

