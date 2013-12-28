
define [
  "underscore",
  "rbush",
  "renderer/properties",
  "./glyph",
], (_, rbush, Properties, Glyph) ->

  class MarkerView extends Glyph.View

    _fields: ['x', 'y', 'size']

    _set_data: () ->
      @max_size = _.max(@size)
      @index = rbush()
      @index.load(
        ([@x[i], @y[i], @x[i], @y[i], {'i': i}] for i in [0..@x.length-1])
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
      [sx, sy] = [geometry.sx, geometry.sy]

      sx0 = sx - @max_size
      sx1 = sx - @max_size
      [x0, x1] = @plot_view.xmapper.v_map_from_target([sx0, sx1])

      sy0 = sy - @max_size
      sy1 = sy - @max_size
      [y0, y1] = @plot_view.ymapper.v_map_from_target([sy0, sy1])

      candidates = (x[4].i for x in @index.search([x0, y0, x1, y1]))

      hits = []
      for i in [0..candidates.length-1]
        s2 = @size[i]/2
        if Math.abs(@sx[i]-sx) <= s2 and Math.abs(@sy[i]-sy) <= s2
          hits.push(i)
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

