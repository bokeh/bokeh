_ = require "underscore"

GuideRenderer = require "../renderers/guide_renderer"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"

class GridView extends Renderer.View
  initialize: (attrs, options) ->
    super(attrs, options)
    @_x_range_name = @mget('x_range_name')
    @_y_range_name = @mget('y_range_name')

  render: () ->
    if @model.visible == false
      return

    ctx = @plot_view.canvas_view.ctx
    ctx.save()
    @_draw_regions(ctx)
    @_draw_minor_grids(ctx)
    @_draw_grids(ctx)
    ctx.restore()

  bind_bokeh_events: () ->
    @listenTo(@model, 'change', @request_render)

  _draw_regions: (ctx) ->
    if not @visuals.band_fill.doit
      return
    [xs, ys] = @model.grid_coords('major', false)
    @visuals.band_fill.set_value(ctx)
    for i in [0...xs.length-1]
      if i % 2 == 1
        [sx0, sy0] = @plot_view.map_to_screen(xs[i], ys[i], @_x_range_name, @_y_range_name)
        [sx1, sy1] = @plot_view.map_to_screen(xs[i+1], ys[i+1], @_x_range_name, @_y_range_name)
        ctx.fillRect(sx0[0], sy0[0], sx1[1]-sx0[0], sy1[1]-sy0[0])
        ctx.fill()
    return

  _draw_grids: (ctx) ->
    if not @visuals.grid_line.doit
      return
    [xs, ys] = @model.grid_coords('major')
    @_draw_grid_helper(ctx, @visuals.grid_line, xs, ys)

  _draw_minor_grids: (ctx) ->
    if not @visuals.minor_grid_line.doit
      return
    [xs, ys] = @model.grid_coords('minor')
    @_draw_grid_helper(ctx, @visuals.minor_grid_line, xs, ys)

  _draw_grid_helper: (ctx, props, xs, ys) ->
    props.set_value(ctx)
    for i in [0...xs.length]
      [sx, sy] = @plot_view.map_to_screen(xs[i], ys[i], @_x_range_name, @_y_range_name)
      ctx.beginPath()
      ctx.moveTo(Math.round(sx[0]), Math.round(sy[0]))
      for i in [1...sx.length]
        ctx.lineTo(Math.round(sx[i]), Math.round(sy[i]))
      ctx.stroke()
    return

class Grid extends GuideRenderer.Model
  default_view: GridView

  type: 'Grid'

  @mixins ['line:grid_', 'line:minor_grid_', 'fill:band_']

  @define {
      bounds:       [ p.Any,     'auto'    ] # TODO (bev)
      dimension:    [ p.Number,  0         ]
      ticker:       [ p.Instance           ]
      x_range_name: [ p.String,  'default' ]
      y_range_name: [ p.String,  'default' ]
    }

  @override {
    level: "underlay"
    band_fill_color: null
    band_fill_alpha: 0
    grid_line_color: '#e5e5e5'
    minor_grid_line_color: null
  }

  ranges: () ->
    i = @get('dimension')
    j = (i + 1) % 2
    frame = @plot.plot_canvas.get('frame')
    ranges = [
      frame.get('x_ranges')[@get('x_range_name')],
      frame.get('y_ranges')[@get('y_range_name')]
    ]
    return [ranges[i], ranges[j]]

   computed_bounds: () ->
    [range, cross_range] = @ranges()

    user_bounds = @get('bounds')
    range_bounds = [range.get('min'), range.get('max')]

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

  grid_coords: (location, exclude_ends=true) ->
    i = @get('dimension')
    j = (i + 1) % 2
    [range, cross_range] = @ranges()

    [start, end] = @computed_bounds()

    tmp = Math.min(start, end)
    end = Math.max(start, end)
    start = tmp

    ticks = @get('ticker').get_ticks(start, end, range, {})[location]

    min = range.get('min')
    max = range.get('max')

    cmin = cross_range.get('min')
    cmax = cross_range.get('max')

    coords = [[], []]
    for ii in [0...ticks.length]
      if (ticks[ii] == min or ticks[ii] == max) and exclude_ends
        continue
      dim_i = []
      dim_j = []
      N = 2
      for n in [0...N]
        loc = cmin + (cmax-cmin)/(N-1) * n
        dim_i.push(ticks[ii])
        dim_j.push(loc)
      coords[i].push(dim_i)
      coords[j].push(dim_j)

    return coords

module.exports =
  Model: Grid
  View: GridView
