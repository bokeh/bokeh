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

    @rule_props = new line_properties(@, {}, 'rule_')

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

    @register_property('rule_coords', @_rule_coords, true)
    @add_dependencies('rule_coords', this, ['bounds', 'dimension', 'location'])

  _rule_coords: () ->
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

    loc = @get_obj('cross_range').get(loc)

    coords = [[], []]

    current_tick = first_tick
    while current_tick <= last_tick
      cmin = @get_obj('cross_range').get('min')
      cmax = @get_obj('cross_range').get('max')
      if current_tick == cmin or current_tick == cmax
        current_tick += interval
        continue
      dim_i = []
      dim_j = []
      coords[i].push(dim_i)
      coords[j].push(dim_j)
      N = 2
      for ii in [0..N-1]
        loc = cmin + (cmax-cmin)/(N-1) * ii
        dim_i.push(current_tick)
        dim_j.push(loc)
      current_tick += interval

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


exports.Rule = Rule
exports.RuleView = RuleView

