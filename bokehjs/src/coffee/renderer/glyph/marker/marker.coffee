_ = require "underscore"
Glyph = require "../glyph"
hittest = require "../../../common/hittest"

class MarkerView extends Glyph.View

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
    angle = { }
    angle[reference_point] = 0

    data = {sx:sx, sy:sy, size: size, angle: angle}
    @_render(ctx, indices, data)

  _index_data: () ->
    @_xy_index()

  _mask_data: (all_indices) ->
    # dilate the inner screen region by max_size and map back to data space for use in
    # spatial query
    hr = @renderer.plot_view.frame.get('h_range')
    vx0 = hr.get('start') - @max_size
    vx1 = hr.get('end') + @max_size
    [x0, x1] = @renderer.xmapper.v_map_from_target([vx0, vx1], true)
    [x0, x1] = [Math.min(x0, x1), Math.max(x0, x1)]

    vr = @renderer.plot_view.frame.get('v_range')
    vy0 = vr.get('start') - @max_size
    vy1 = vr.get('end') + @max_size
    [y0, y1] = @renderer.ymapper.v_map_from_target([vy0, vy1], true)
    [y0, y1] = [Math.min(y0, y1), Math.max(y0, y1)]

    return (x[4].i for x in @index.search([x0, y0, x1, y1]))

  _hit_point: (geometry) ->
    [vx, vy] = [geometry.vx, geometry.vy]
    sx = @renderer.plot_view.canvas.vx_to_sx(vx)
    sy = @renderer.plot_view.canvas.vy_to_sy(vy)

    vx0 = vx - @max_size
    vx1 = vx + @max_size
    [x0, x1] = @renderer.xmapper.v_map_from_target([vx0, vx1], true)

    vy0 = vy - @max_size
    vy1 = vy + @max_size
    [y0, y1] = @renderer.ymapper.v_map_from_target([vy0, vy1], true)

    candidates = (x[4].i for x in @index.search([x0, y0, x1, y1]))

    hits = []
    for i in candidates
      s2 = @size[i]/2
      dist = Math.abs(@sx[i]-sx) + Math.abs(@sy[i]-sy)
      if Math.abs(@sx[i]-sx) <= s2 and Math.abs(@sy[i]-sy) <= s2
        hits.push([i, dist])
    result = hittest.create_hit_test_result()
    result['1d'].indices = _.chain(hits)
      .sortBy((elt) -> return elt[1])
      .map((elt) -> return elt[0])
      .value()
    return result

  _hit_rect: (geometry) ->
    [x0, x1] = @renderer.xmapper.v_map_from_target([geometry.vx0, geometry.vx1], true)
    [y0, y1] = @renderer.ymapper.v_map_from_target([geometry.vy0, geometry.vy1], true)

    result = hittest.create_hit_test_result()
    result['1d'].indices = (x[4].i for x in @index.search([x0, y0, x1, y1]))
    return result

  _hit_poly: (geometry) ->
    [vx, vy] = [geometry.vx, geometry.vy]
    sx = @renderer.plot_view.canvas.v_vx_to_sx(vx)
    sy = @renderer.plot_view.canvas.v_vy_to_sy(vy)

    # TODO (bev) use spatial index to pare candidate list
    candidates = [0...@sx.length]

    hits = []
    for i in [0...candidates.length]
      idx = candidates[i]
      if hittest.point_in_poly(@sx[i], @sy[i], sx, sy)
        hits.push(idx)
    result = hittest.create_hit_test_result()
    result['1d'].indices = hits
    return result

class Marker extends Glyph.Model
  distances: ['size']
  angles: ['angle']

  display_defaults: ->
    return _.extend {}, super(), {
      size: 4
      angle: 0
    }

module.exports =
  Model: Marker
  View: MarkerView
