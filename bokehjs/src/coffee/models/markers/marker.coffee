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
    hr = @renderer.plot_view.frame.bbox.h_range
    sx0 = hr.start - @max_size
    sx1 = hr.end + @max_size
    [x0, x1] = @renderer.xscale.r_invert(sx0, sx1)

    vr = @renderer.plot_view.frame.bbox.v_range
    sy0 = vr.start - @max_size
    sy1 = vr.end + @max_size
    [y0, y1] = @renderer.yscale.r_invert(sy0, sy1)

    bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    return @index.indices(bbox)

  _hit_point: (geometry) ->
    {sx, sy} = geometry

    sx0 = sx - @max_size
    sx1 = sx + @max_size
    [x0, x1] = @renderer.xscale.r_invert(sx0, sx1)

    sy0 = sy - @max_size
    sy1 = sy + @max_size
    [y0, y1] = @renderer.yscale.r_invert(sy0, sy1)

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
    {sx, sy} = geometry
    {minX, minY, maxX, maxY} = this.bounds()
    result = hittest.create_hit_test_result()

    if geometry.direction == 'h'
      y0 = minY
      y1 = maxY
      ms = @max_size/2
      sx0 = sx - ms
      sx1 = sx + ms
      [x0, x1] = @renderer.xscale.r_invert(sx0, sx1)
    else
      x0 = minX
      x1 = maxX
      ms = @max_size/2
      sy0 = sy - ms
      sy1 = sy + ms
      [y0, y1] = @renderer.yscale.r_invert(sy0, sy1)

    bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    hits = @index.indices(bbox)

    result['1d'].indices = hits
    return result

  _hit_rect: (geometry) ->
    {sx0, sx1, sy0, sy1} = geometry
    [x0, x1] = @renderer.xscale.r_invert(sx0, sx1)
    [y0, y1] = @renderer.yscale.r_invert(sy0, sy1)
    bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    result = hittest.create_hit_test_result()
    result['1d'].indices = @index.indices(bbox)
    return result

  _hit_poly: (geometry) ->
    {sx, sy} = geometry

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
