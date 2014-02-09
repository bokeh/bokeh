
define [
  "underscore",
  "common/safebind",
  "common/has_parent",
  "common/ticking",
  "renderer/properties",
  "common/plot_widget",
], (_, safebind, HasParent, ticking, Properties, PlotWidget) ->

  line_properties = Properties.line_properties

  class GridView extends PlotWidget
    initialize: (attrs, options) ->
      super(attrs, options)

      @grid_props = new line_properties(@, null, 'grid_')

    render: () ->
      ctx = @plot_view.ctx

      ctx.save()
      @_draw_grids(ctx)
      ctx.restore()

    bind_bokeh_events: () ->
      safebind(this, @model, 'change', @request_render)

    _draw_grids: (ctx) ->
      if not @grid_props.do_stroke
        return
      [xs, ys] = @mget('grid_coords')
      @grid_props.set(ctx, @)
      for i in [0...xs.length]
        [sx, sy] = @plot_view.map_to_screen(xs[i], "data", ys[i], "data")
        ctx.beginPath()
        ctx.moveTo(Math.round(sx[0]), Math.round(sy[0]))
        for i in [1...sx.length]
          ctx.lineTo(Math.round(sx[i]), Math.round(sy[i]))
        ctx.stroke()
      return

  class Grid extends HasParent
    default_view: GridView
    type: 'Grid'

    initialize: (attrs, options)->
      super(attrs, options)

      @register_property('computed_bounds', @_bounds, false)
      @add_dependencies('computed_bounds', this, ['bounds'])

      # FIXME Is it better to register a property?  Or just use a member
      # variable?
      @register_property('scale', @_scale, true)
      @add_dependencies('scale', this, ['is_datetime'])

      @register_property('grid_coords', @_grid_coords, false)
      @add_dependencies('grid_coords', this, ['computed_bounds', 'dimension', 'scale'])

    _scale: () ->
      if @get('is_datetime')
        return new ticking.DatetimeScale()
      else
        return new ticking.BasicScale()

     _bounds: () ->
      i = @get('dimension')
      j = (i + 1) % 2

      ranges = [@get_obj('plot').get_obj('x_range'), @get_obj('plot').get_obj('y_range')]

      user_bounds = @get('bounds') ? 'auto'
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

    _grid_coords: () ->
      i = @get('dimension')
      j = (i + 1) % 2
      ranges = [@get_obj('plot').get_obj('x_range'), @get_obj('plot').get_obj('y_range')]
      range = ranges[i]
      cross_range = ranges[j]

      [start, end] = @get('computed_bounds')

      tmp = Math.min(start, end)
      end = Math.max(start, end)
      start = tmp

      ticks = @get('scale').get_ticks(start, end, range, {})

      min = range.get('min')
      max = range.get('max')

      cmin = cross_range.get('min')
      cmax = cross_range.get('max')

      coords = [[], []]
      for ii in [0...ticks.length]
        if ticks[ii] == min or ticks[ii] == max
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

    display_defaults: () ->
      return {
        level: 'underlay'
        grid_line_color: '#cccccc'
        grid_line_width: 1
        grid_line_alpha: 1.0
        grid_line_join: 'miter'
        grid_line_cap: 'butt'
        grid_line_dash: []
        grid_line_dash_offset: 0
      }

  class Grids extends Backbone.Collection
     model: Grid

  return {
    "Model": Grid,
    "Collection": new Grids(),
    "View": GridView
  }
