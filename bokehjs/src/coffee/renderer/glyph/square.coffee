
define [
  "underscore",
  "rbush",
  "renderer/properties",
  "./rect",
], (_, rbush, Properties, Rect) ->

  class SquareView extends Rect.View

    _fields: ['x', 'y', 'size', 'angle']
    _properties: ['line', 'fill']

    _set_data: () ->
      @max_size = _.max(@size)
      @index = rbush()
      @index.load(
        ([@x[i], @y[i], @x[i], @y[i], {'i': i}] for i in [0..@x.length-1])
      )

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      @sw = @distance_vector('x', 'size', 'center')
      @sh = @sw

    _mask_data: () ->
      # dilate the inner screen region by max_size and map back to data space for use in
      # spatial query
      hr = @plot_view.view_state.get('inner_range_horizontal')
      sx0 = hr.get('start') - @max_size
      sx1 = hr.get('end') - @max_size
      [x0, x1] = @plot_view.xmapper.v_map_from_target([sx0, sx1])

      vr = @plot_view.view_state.get('inner_range_vertical')
      sy0 = vr.get('start') - @max_size
      sy1 = vr.get('end') - @max_size
      [y0, y1] = @plot_view.ymapper.v_map_from_target([sy0, sy1])

      @mask = (x[4].i for x in @index.search([x0, y0, x1, y1]))

    # squares do not inherit from Marker, so we must supply hit testers explicitly
    _hit_point: (geometry) ->
      [sx, sy] = [geometry.sx, geometry.sy]
      [x, y] = @plot_view.xmapper.v_map_from_target([sx, sy])

      if @size_units == "screen"
        sx0 = sx - @max_radius
        sx1 = sx - @max_radius
        [x0, x1] = @plot_view.xmapper.v_map_from_target([sx0, sx1])

        sy0 = sy - @max_radius
        sy1 = sy - @max_radius
        [y0, y1] = @plot_view.ymapper.v_map_from_target([sy0, sy1])

      else
        sx0 = sx - @max_size
        sx1 = sx - @max_size
        [x0, x1] = @plot_view.xmapper.v_map_from_target([sx0, sx1])

        sy0 = sy - @max_size
        sy1 = sy - @max_size
        [y0, y1] = @plot_view.ymapper.v_map_from_target([sy0, sy1])

      candidates = (x[4].i for x in @index.search([x0, y0, x1, y1]))

      hits = []
      if @size_units == "screen"
        for i in [0..candidates.length-1]
          s2 = @size[i]/2
          if Math.abs(@sx[i]-sx) <= s2 and Math.abs(@sy[i]-sy) <= s2
            hits.push(i)
      else
        for i in [0..candidates.length-1]
          s2 = @size[i]^2
          if Math.abs(@x[i]-x) <= s2 and Math.abs(@y[i]-y) <= s2
            hits.push(i)
      return hits

    _hit_rect: (geometry) ->
      [x0, y0] = @plot_view.xmapper.v_map_from_target([geometry.sx0, geometry.sy0])
      [x1, y1] = @plot_view.xmapper.v_map_from_target([geometry.sx1, geometry.sy1])

      return (x[4].i for x in @index.search([x0, y0, x1, y1]))


    draw_legend: (ctx, x1, x2, y1, y2) ->
      ## dummy legend function just draws a circle.. this way
      ## even if we have a differnet glyph shape, at least we get the
      ## right colors present
      glyph_props = @glyph_props
      line_props = glyph_props.line_properties
      fill_props = glyph_props.fill_properties
      ctx.save()

      reference_point = @get_reference_point()
      if reference_point?
        glyph_settings = reference_point
        data_w = @distance([reference_point], 'x', 'size', 'center')[0]
        data_h = data_w
      else
        glyph_settings = glyph_props
      border = line_props.select(line_props.line_width_name, glyph_settings)

      ctx.beginPath()
      w = Math.abs(x2-x1)
      h = Math.abs(y2-y1)
      w = w - 2*border
      h = h - 2*border
      if data_w?
        w = if data_w > w then w else data_w
      if data_h?
        h = if data_h > h then h else data_h
      x = (x1 + x2) / 2 - (w / 2)
      y = (y1 + y2) / 2 - (h / 2)
      ctx.rect(x, y, w, h)

      if glyph_props.fill_properties.do_fill
        glyph_props.fill_properties.set_vectorize(ctx, i)
        ctx.fill()

      if glyph_props.line_properties.do_stroke
        glyph_props.line_properties.set_vectorize(ctx, i)
        ctx.stroke()

  class Square extends Rect.Model
    default_view: SquareView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
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
    "Model": Square,
    "View": SquareView,
  }

