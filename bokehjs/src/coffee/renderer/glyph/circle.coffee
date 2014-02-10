
define [
  "underscore",
  "rbush",
  "renderer/properties",
  "./glyph",
], (_, rbush, Properties, Glyph) ->

  class CircleView extends Glyph.View

    _properties: ['line', 'fill']

    # we need a custom initializer because circles may either take glyph-style radius (defaults
    # to data units) or a marker-style size (defaults to screen units)
    initialize: (options) ->
      spec = @mget('glyphspec')
      if spec.radius?
        @_fields = ['x', 'y', 'radius']
      else if spec.size?
        @_fields = ['x', 'y', 'size']
      super(options)

    _set_data: () ->
      if @size
        @max_radius = _.max(@size)/2
      else
        @max_radius = _.max(@radius)
      @index = rbush()
      @index.load(
        ([@x[i], @y[i], @x[i], @y[i], {'i': i}] for i in [0...@x.length])
      )

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      if @size
        @radius = (s/2 for s in @distance_vector('x', 'size', 'edge'))
        @radius_units = @size_units
      else
        @radius = @distance_vector('x', 'radius', 'edge')

    _mask_data: () ->
      hr = @plot_view.view_state.get('inner_range_horizontal')
      vr = @plot_view.view_state.get('inner_range_vertical')

      if @radius_units == "screen"
        sx0 = hr.get('start') - @max_radius
        sx1 = hr.get('end') - @max_radius
        [x0, x1] = @plot_view.xmapper.v_map_from_target([sx0, sx1])

        sy0 = vr.get('start') - @max_radius
        sy1 = vr.get('end') - @max_radius
        [y0, y1] = @plot_view.ymapper.v_map_from_target([sy0, sy1])

      else
        sx0 = hr.get('start')
        sx1 = hr.get('end')
        [x0, x1] = @plot_view.xmapper.v_map_from_target([sx0, sx1])
        x0 -= @max_radius
        x1 += @max_radius

        sy0 = vr.get('start')
        sy1 = vr.get('end')
        [y0, y1] = @plot_view.ymapper.v_map_from_target([sy0, sy1])
        y0 -= @max_radius
        y1 += @max_radius

      return (x[4].i for x in @index.search([x0, y0, x1, y1]))

    _render: (ctx, indices, glyph_props, sx=@sx, sy=@sy, radius=@radius) ->
      for i in indices

        if isNaN(sx[i] + sy[i] + radius[i])
            continue

        ctx.beginPath()
        ctx.arc(sx[i], sy[i], radius[i], 0, 2*Math.PI, false)

        if glyph_props.fill_properties.do_fill
          glyph_props.fill_properties.set_vectorize(ctx,i)
          ctx.fill()

        if glyph_props.line_properties.do_stroke
          glyph_props.line_properties.set_vectorize(ctx, i)
          ctx.stroke()

    _hit_point: (geometry) ->
      [sx, sy] = [geometry.sx, geometry.sy]
      [x, y] = @plot_view.xmapper.v_map_from_target([sx, sy])

      if @radius_units == "screen"
        sx0 = sx - @max_radius
        sx1 = sx - @max_radius
        [x0, x1] = @plot_view.xmapper.v_map_from_target([sx0, sx1])

        sy0 = sy - @max_radius
        sy1 = sy - @max_radius
        [y0, y1] = @plot_view.ymapper.v_map_from_target([sy0, sy1])

      else
        x0 = x - @max_radius
        x1 = x + @max_radius

        y0 = y - @max_radius
        y1 = y + @max_radius

      candidates = (x[4].i for x in @index.search([x0, y0, x1, y1]))

      hits = []
      if @radius_units == "screen"
        for i in [0...candidates.length]
          r2 = @radius[i]^2
          if (@sx[i]-sx)^2 + (@sy[i]-sy)^2 <= r2
            hits.push(i)
      else
        for i in [0...candidates.length]
          r2 = @radius[i]^2
          if (@x[i]-x)^2 + (@y[i]-y)^2 <= r2
            hits.push(i)
      return hits

    _hit_rect: (geometry) ->
      [x0, x1] = @plot_view.xmapper.v_map_from_target([geometry.vx0, geometry.vx1])
      [y0, y1] = @plot_view.ymapper.v_map_from_target([geometry.vy0, geometry.vy1])

      return (x[4].i for x in @index.search([x0, y0, x1, y1]))

    # circle does not inherit from marker (since it also accepts radius) so we
    # must supply a draw_legend for it  here
    draw_legend: (ctx, x0, x1, y0, y1) ->
      reference_point = @get_reference_point() ? 0

      # using objects like this seems a little wonky, since the keys are coerced to
      # stings, but it works
      indices = [reference_point]
      sx = { }
      sx[reference_point] = (x0+x1)/2
      sy = { }
      sy[reference_point] = (y0+y1)/2
      radius = { }
      radius[reference_point] = Math.min(Math.abs(x1-x0), Math.abs(y1-y0))*0.4

      @_render(ctx, indices, @glyph_props, sx, sy, radius)

  class Circle extends Glyph.Model
    default_view: CircleView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        radius_units: 'data'
        size_units: 'screen'

        fill_color: 'gray'
        fill_alpha: 1.0

        line_color: 'red'
        line_width: 1
        line_alpha: 1.0
        line_join: 'miter'
        line_cap: 'butt'
        line_dash: []
        line_dash_offset: 0
      })

  return {
    "Model": Circle,
    "View": CircleView,
  }
