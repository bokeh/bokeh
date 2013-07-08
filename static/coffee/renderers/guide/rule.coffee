base = require('../../base')
HasParent = base.HasParent
safebind = base.safebind

properties = require('../properties')
line_properties = properties.line_properties

PlotWidget = require('../../common/plot_widget').PlotWidget
ticking = require('../../common/ticking')


class RuleView extends PlotWidget
  initialize: (attrs, options) ->
    super(attrs, options)

    guidespec = @mget('guidespec')
    @rule_props = new line_properties(@, guidespec, 'rule_')

  render: () ->
    ctx = @plot_view.ctx

    ctx.save()
    @_draw_rules(ctx)
    ctx.restore()

  bind_bokeh_events: () ->
    safebind(this, @model, 'change', @request_render)

  _draw_rules: (ctx) ->
    [xs, ys] = @mget('rule_coords')
    @rule_props.set(ctx, @)
    for i in [0..xs.length-1]
      [sx, sy] = @plot_view.map_to_screen(xs[i], "data", ys[i], "data")
      ctx.beginPath()
      ctx.moveTo(sx[0], sy[0])
      for i in [1..sx.length-1]
        ctx.lineTo(sx[i], sy[i])
      ctx.stroke()
    return


class Rule extends HasParent
  default_view: RuleView
  type: 'GuideRenderer'

  initialize: (attrs, options)->
    super(attrs, options)

    @register_property('bounds', @_bounds, false)
    @add_dependencies('bounds', this, ['guidespec'])

    @register_property('rule_coords', @_rule_coords, false)
    @add_dependencies('rule_coords', this, ['bounds', 'dimension', 'location'])

   _bounds: () ->
    i = @get('guidespec').dimension
    j = (i + 1) % 2

    ranges = [@get_obj('plot').get_obj('x_range'), @get_obj('plot').get_obj('y_range')]

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
    ranges = [@get_obj('plot').get_obj('x_range'), @get_obj('plot').get_obj('y_range')]
    range = ranges[i]
    cross_range = ranges[j]

    [start, end] = @get('bounds')

    tmp = Math.min(start, end)
    end = Math.max(start, end)
    start = tmp

    interval = ticking.auto_interval(start, end)
    ticks = ticking.auto_ticks(null, null, start, end, interval)

    min = range.get('min')
    max = range.get('max')

    cmin = cross_range.get('min')
    cmax = cross_range.get('max')

    coords = [[], []]
    for ii in [0..ticks.length-1]
      if ticks[ii] == min or ticks[ii] == max
        continue
      dim_i = []
      dim_j = []
      N = 2
      for n in [0..N-1]
        loc = cmin + (cmax-cmin)/(N-1) * n
        dim_i.push(ticks[ii])
        dim_j.push(loc)
      coords[i].push(dim_i)
      coords[j].push(dim_j)

    return coords



Rule::defaults = _.clone(Rule::defaults)


Rule::display_defaults = _.clone(Rule::display_defaults)
_.extend(Rule::display_defaults, {

  level: 'underlay'

  rule_line_color: '#aaaaaa'
  rule_line_width: 1
  rule_line_alpha: 1.0
  rule_line_join: 'miter'
  rule_line_cap: 'butt'
  rule_line_dash: [4, 6]
  rule_line_dash_offset: 0

})


class Rules extends Backbone.Collection
   model: Rule
exports.rules = new Rules()
exports.Rule = Rule
exports.RuleView = RuleView
