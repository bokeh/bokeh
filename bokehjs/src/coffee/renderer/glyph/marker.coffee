
define [
  "underscore",
  "rbush",
  "renderer/properties",
  "./glyph",
], (_, rbush, Properties, Glyph) ->

  class MarkerView extends Glyph.View

    _fields: ['x', 'y', 'size']

    draw_legend: (ctx, x0, x1, y0, y1) ->
      reference_point = @get_reference_point() ? 0

      # using objects like this seems a little wonky, since the keys are coerced to
      # stings, but it works
      indices = [reference_point]
      sx = { }
      sx[reference_point] = (x0+x1)/2
      sy = { }
      sy[reference_point] = (y0+y1)/2
      size = { }
      size[reference_point] = Math.min(Math.abs(x1-x0), Math.abs(y1-y0))*0.8

      @_render(ctx, indices, @glyph_props, sx, sy, size)

    _set_data: () ->
      @max_size = _.max(@size)
      @index = rbush()
      @index.load(
        ([@x[i], @y[i], @x[i], @y[i], {'i': i}] for i in [0...@x.length])
      )

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)

    _mask_data: () ->
      # dilate the inner screen region by max_size and map back to data space for use in
      # spatial query
      hr = @plot_view.view_state.get('inner_range_horizontal')
      vx0 = hr.get('start') - @max_size
      vx1 = hr.get('end') + @max_size
      [x0, x1] = @plot_view.xmapper.v_map_from_target([vx0, vx1])

      vr = @plot_view.view_state.get('inner_range_vertical')
      vy0 = vr.get('start') - @max_size
      vy1 = vr.get('end') + @max_size
      [y0, y1] = @plot_view.ymapper.v_map_from_target([vy0, vy1])

      return (x[4].i for x in @index.search([x0, y0, x1, y1]))

    _hit_point: (geometry) ->
      [vx, vy] = [geometry.vx, geometry.vy]
      sx = @plot_view.view_state.vx_to_sx(vx)
      sy = @plot_view.view_state.vy_to_sy(vy)

      vx0 = vx - @max_size
      vx1 = vx + @max_size
      [x0, x1] = @plot_view.xmapper.v_map_from_target([vx0, vx1])

      vy0 = vy - @max_size
      vy1 = vy + @max_size
      [y0, y1] = @plot_view.ymapper.v_map_from_target([vy0, vy1])

      candidates = (x[4].i for x in @index.search([x0, y0, x1, y1]))

      hits = []
      for i in candidates
        s2 = @size[i]/2
        dist = Math.abs(@sx[i]-sx) + Math.abs(@sy[i]-sy)
        if Math.abs(@sx[i]-sx) <= s2 and Math.abs(@sy[i]-sy) <= s2
          hits.push([i, dist])
      hits = _.chain(hits)
        .sortBy((elt) -> return elt[1])
        .map((elt) -> return elt[0])
        .value()
      return hits

    _hit_rect: (geometry) ->
      [x0, x1] = @plot_view.xmapper.v_map_from_target([geometry.vx0, geometry.vx1])
      [y0, y1] = @plot_view.ymapper.v_map_from_target([geometry.vy0, geometry.vy1])

      return (x[4].i for x in @index.search([x0, y0, x1, y1]))

  class Marker extends Glyph.Model

  return {
    "Model": Marker,
    "View": MarkerView,
  }

