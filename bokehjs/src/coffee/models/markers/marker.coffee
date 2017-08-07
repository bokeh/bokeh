import {XYGlyph, XYGlyphView} from "../glyphs/xy_glyph"
import * as hittest from "core/hittest"
import * as p from "core/properties"

export class MarkerView extends XYGlyphView

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    # using objects like this seems a little wonky, since the keys are coerced to
    # stings, but it works
    indices = [index]
    sx = { }
    sx[index] = (x0+x1)/2
    sy = { }
    sy[index] = (y0+y1)/2
    size = { }
    size[index] = Math.min(Math.abs(x1-x0), Math.abs(y1-y0))*0.4
    angle = { }
    angle[index] = @_angle[index]

    data = {sx:sx, sy:sy, _size: size, _angle: angle}
    @_render(ctx, indices, data)

  _render: (ctx, indices, {sx, sy, _size, _angle}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+_size[i]+_angle[i])
        continue

      r = _size[i]/2

      ctx.beginPath()
      ctx.translate(sx[i], sy[i])

      if _angle[i]
        ctx.rotate(_angle[i])

      @_render_one(ctx, i, sx[i], sy[i], r, @visuals.line, @visuals.fill)

      if _angle[i]
        ctx.rotate(-_angle[i])

      ctx.translate(-sx[i], -sy[i])

  _mask_data: (all_indices) ->
    # dilate the inner screen region by max_size and map back to data space for use in
    # spatial query
    hr = @renderer.plot_view.frame.h_range
    vx0 = hr.start - @max_size
    vx1 = hr.end + @max_size
    [x0, x1] = @renderer.xscale.v_invert([vx0, vx1])

    vr = @renderer.plot_view.frame.v_range
    vy0 = vr.start - @max_size
    vy1 = vr.end + @max_size
    [y0, y1] = @renderer.yscale.v_invert([vy0, vy1])

    bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    return @index.indices(bbox)

  _hit_point: (geometry) ->
    [vx, vy] = [geometry.vx, geometry.vy]
    sx = @renderer.plot_view.canvas.vx_to_sx(vx)
    sy = @renderer.plot_view.canvas.vy_to_sy(vy)

    vx0 = vx - @max_size
    vx1 = vx + @max_size
    [x0, x1] = @renderer.xscale.v_invert([vx0, vx1])

    vy0 = vy - @max_size
    vy1 = vy + @max_size
    [y0, y1] = @renderer.yscale.v_invert([vy0, vy1])

    bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    candidates = @index.indices(bbox)

    hits = []
    for i in candidates
      s2 = @_size[i]/2
      dist = Math.abs(@sx[i]-sx) + Math.abs(@sy[i]-sy)
      if Math.abs(@sx[i]-sx) <= s2 and Math.abs(@sy[i]-sy) <= s2
        hits.push([i, dist])
    return hittest.create_1d_hit_test_result(hits)

  _hit_span: (geometry) ->
    [vx, vy] = [geometry.vx, geometry.vy]
    {minX, minY, maxX, maxY} = this.bounds()
    result = hittest.create_hit_test_result()

    if geometry.direction == 'h'
      y0 = minY
      y1 = maxY
      ms = @max_size/2
      vx0 = vx - ms
      vx1 = vx + ms
      [x0, x1] = @renderer.xscale.v_invert([vx0, vx1])
    else
      x0 = minX
      x1 = maxX
      ms = @max_size/2
      vy0 = vy - ms
      vy1 = vy + ms
      [y0, y1] = @renderer.yscale.v_invert([vy0, vy1])

    bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    hits = @index.indices(bbox)

    result['1d'].indices = hits
    return result

  _hit_rect: (geometry) ->
    [x0, x1] = @renderer.xscale.v_invert([geometry.vx0, geometry.vx1])
    [y0, y1] = @renderer.yscale.v_invert([geometry.vy0, geometry.vy1])
    bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    result = hittest.create_hit_test_result()
    result['1d'].indices = @index.indices(bbox)
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

export class Marker extends XYGlyph

  @mixins ['line', 'fill']
  @define {
    size:  [ p.DistanceSpec, { units: "screen", value: 4 } ]
    angle: [ p.AngleSpec,    0                             ]
  }
