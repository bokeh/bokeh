base = require('../../base')
HasParent = base.HasParent
safebind = base.safebind

properties = require('../properties')
line_properties = properties.line_properties

PlotWidget = require('../../common/plot_widget').PlotWidget


class LinearAxisView extends PlotWidget
  initialize: (attrs, options) ->
    super(attrs, options)

    debugger
    @rule_props = new line_properties(@, {}, 'rule_')

  render: () ->

    [x, y] = @mget('rule_coords')
    [sx, sy] = @plot_view.map_to_screen(x, "data", y, "data")

    ctx = @plot_view.ctx

    ctx.save()

    #@rule_props.set(@ctx, @)
    ctx.beginPath()
    ctx.moveTo(sx[0], sy[0])
    for i in [1..sx.length-1]
      ctx.lineTo(sx[i], sy[i])
    ctx.stroke()

    ctx.restore()

  bind_bokeh_events: () ->
    safebind(this, @model, 'change', @request_render)


class LinearAxis extends HasParent
  default_view: LinearAxisView
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

    dim = @get('dimension')

    xs = new Array(2)
    ys = new Array(2)
    coords = [xs, ys]

    loc = @get('location')
    if _.isString(loc)
      loc = @get_obj('cross_range').get(loc)

    ndim = 2
    for i in [0..ndim-1]
      if i == dim
        coords[i][0] = start
        coords[i][1] = end
      else
        coords[i][0] = loc
        coords[i][1] = loc

    return coords

LinearAxis::defaults = _.clone(LinearAxis::defaults)


LinearAxis::display_defaults = _.clone(LinearAxis::display_defaults)
_.extend(LinearAxis::display_defaults, {

  rule_line_color: 'black'
  rule_line_width: 1
  rule_line_alpha: 1.0
  rule_line_join: 'miter'
  rule_line_cap: 'butt'
  rule_line_dash: []
  rule_line_dash_offset: 0

})


exports.LinearAxis = LinearAxis
exports.LinearAxisView = LinearAxisView

