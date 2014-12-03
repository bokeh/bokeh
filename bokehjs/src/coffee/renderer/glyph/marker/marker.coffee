define [
  "underscore",
  "rbush",
  "../glyph",
], (_, rbush, Glyph) ->


  point_in_poly = (x, y, px, py) ->
    inside = false

    x1 = px[px.length-1]
    y1 = py[py.length-1]

    for i in [0...px.length]
        x2 = px[i]
        y2 = py[i]
        if ( y1 < y ) != ( y2 < y )
            if x1 + ( y - y1 ) / ( y2 - y1 ) * ( x2 - x1 ) < x
                inside = not inside
        x1 = x2
        y1 = y2

    return inside

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
      size[reference_point] = Math.min(Math.abs(x1-x0), Math.abs(y1-y0))*0.4

      @_render(ctx, indices, sx, sy, size)

    _set_data: () ->
      @max_size = _.max(@size)
      @index = rbush()
      pts = []
      for i in [0...@x.length]
        if not isNaN(@x[i] + @y[i])
          pts.push([@x[i], @y[i], @x[i], @y[i], {'i': i}])
      @index.load(pts)

    _map_data: () ->
      [@sx, @sy] = @renderer.map_to_screen(@x, @glyph.x.units, @y, @glyph.y.units)

    _mask_data: () ->
      # dilate the inner screen region by max_size and map back to data space for use in
      # spatial query
      hr = @renderer.plot_view.frame.get('h_range')
      vx0 = hr.get('start') - @max_size
      vx1 = hr.get('end') + @max_size
      [x0, x1] = @renderer.xmapper.v_map_from_target([vx0, vx1])

      vr = @renderer.plot_view.frame.get('v_range')
      vy0 = vr.get('start') - @max_size
      vy1 = vr.get('end') + @max_size
      [y0, y1] = @renderer.ymapper.v_map_from_target([vy0, vy1])

      return (x[4].i for x in @index.search([x0, y0, x1, y1]))

    _hit_point: (geometry) ->
      [vx, vy] = [geometry.vx, geometry.vy]
      sx = @renderer.plot_view.canvas.vx_to_sx(vx)
      sy = @renderer.plot_view.canvas.vy_to_sy(vy)

      vx0 = vx - @max_size
      vx1 = vx + @max_size
      [x0, x1] = @renderer.xmapper.v_map_from_target([vx0, vx1])

      vy0 = vy - @max_size
      vy1 = vy + @max_size
      [y0, y1] = @renderer.ymapper.v_map_from_target([vy0, vy1])

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
      [x0, x1] = @renderer.xmapper.v_map_from_target([geometry.vx0, geometry.vx1])
      [y0, y1] = @renderer.ymapper.v_map_from_target([geometry.vy0, geometry.vy1])

      return (x[4].i for x in @index.search([x0, y0, x1, y1]))

    _hit_poly: (geometry) ->
      [vx, vy] = [geometry.vx, geometry.vy]
      sx = @renderer.plot_view.canvas.v_vx_to_sx(vx)
      sy = @renderer.plot_view.canvas.v_vy_to_sy(vy)

      # TODO (bev) use spatial index to pare candidate list
      candidates = [0...@sx.length]

      hits = []
      for i in [0...candidates.length]
        idx = candidates[i]
        if point_in_poly(@sx[i], @sy[i], sx, sy)
          hits.push(idx)
      return hits

  class Marker extends Glyph.Model

    display_defaults: ->
      return _.extend {}, super(), {
        size: 4
      }

  class Markers extends Glyph.Collection

  return {
    Model: Marker
    View: MarkerView
    Collection: Markers
  }
