import {RBush} from "core/util/spatial"
import {Glyph, GlyphView} from "./glyph"
import {min, max, copy, findLastIndex} from "core/util/array"
import {isStrictNaN} from "core/util/types"
import * as hittest from "core/hittest"

export class PatchesView extends GlyphView

  _build_discontinuous_object: (nanned_qs) ->
    # _s is @xs, @ys, @sxs, @sys
    # an object of n 1-d arrays in either data or screen units
    #
    # Each 1-d array gets broken to an array of arrays split
    # on any NaNs
    #
    # So:
    # { 0: [x11, x12],
    #   1: [x21, x22, x23],
    #   2: [x31, NaN, x32]
    # }
    # becomes
    # { 0: [[x11, x12]],
    #   1: [[x21, x22, x23]],
    #   2: [[x31],[x32]]
    # }
    ds = {}
    for i in [0...nanned_qs.length]
      ds[i] = []
      qs = copy(nanned_qs[i])
      while qs.length > 0

        nan_index = findLastIndex(qs, (q) -> isStrictNaN(q))

        if nan_index >= 0
          qs_part = qs.splice(nan_index)
        else
          qs_part = qs
          qs = []

        denanned = (q for q in qs_part when not isStrictNaN(q))
        ds[i].push(denanned)
    return ds


  _index_data: () ->
    xss = @_build_discontinuous_object(@_xs)
    yss = @_build_discontinuous_object(@_ys)

    points = []
    for i in [0...@_xs.length]
      for j in [0...xss[i].length]
        xs = xss[i][j]
        ys = yss[i][j]
        if xs.length == 0
          continue
        points.push({
          minX: min(xs),
          minY: min(ys),
          maxX: max(xs),
          maxY: max(ys),
          i: i
        })

    return new RBush(points)

  _mask_data: (all_indices) ->
    xr = @renderer.plot_view.frame.x_ranges.default
    [x0, x1] = [xr.min, xr.max]

    yr = @renderer.plot_view.frame.y_ranges.default
    [y0, y1] = [yr.min, yr.max]

    bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    return @index.indices(bbox)

  _render: (ctx, indices, {sxs, sys}) ->
    # @sxss and @syss are used by _hit_point and sxc, syc
    # This is the earliest we can build them, and only build them once
    @renderer.sxss = @_build_discontinuous_object(sxs)
    @renderer.syss = @_build_discontinuous_object(sys)
    for i in indices
      [sx, sy] = [sxs[i], sys[i]]

      if @visuals.fill.doit
        @visuals.fill.set_vectorize(ctx, i)

        for j in [0...sx.length]
          if j == 0
            ctx.beginPath()
            ctx.moveTo(sx[j], sy[j])
            continue
          else if isNaN(sx[j] + sy[j])
            ctx.closePath()
            ctx.fill()
            ctx.beginPath()
            continue
          else
            ctx.lineTo(sx[j], sy[j])

        ctx.closePath()
        ctx.fill()

      if @visuals.line.doit
        @visuals.line.set_vectorize(ctx, i)

        for j in [0...sx.length]
          if j == 0
            ctx.beginPath()
            ctx.moveTo(sx[j], sy[j])
            continue
          else if isNaN(sx[j] + sy[j])
            ctx.closePath()
            ctx.stroke()
            ctx.beginPath()
            continue
          else
            ctx.lineTo(sx[j], sy[j])

        ctx.closePath()
        ctx.stroke()

  _hit_point: (geometry) ->
    [vx, vy] = [geometry.vx, geometry.vy]
    sx = @renderer.plot_view.canvas.vx_to_sx(vx)
    sy = @renderer.plot_view.canvas.vy_to_sy(vy)

    x = @renderer.xscale.invert(vx)
    y = @renderer.yscale.invert(vy)

    candidates = @index.indices({minX: x, minY: y, maxX: x, maxY: y})

    hits = []
    for i in [0...candidates.length]
      idx = candidates[i]
      sxs = @renderer.sxss[idx]
      sys = @renderer.syss[idx]
      for j in [0...sxs.length]
        if hittest.point_in_poly(sx, sy, sxs[j], sys[j])
          hits.push(idx)

    result = hittest.create_hit_test_result()
    result['1d'].indices = hits
    return result

  _get_snap_coord: (array) ->
      sum = 0
      for s in array
        sum += s
      return sum / array.length

  scx: (i, sx, sy) ->
    if @renderer.sxss[i].length is 1
      # We don't have discontinuous objects so we're ok
      return @_get_snap_coord(@sxs[i])
    else
      # We have discontinuous objects, so we need to find which
      # one we're in, we can use point_in_poly again
      sxs = @renderer.sxss[i]
      sys = @renderer.syss[i]
      for j in [0...sxs.length]
        if hittest.point_in_poly(sx, sy, sxs[j], sys[j])
          return @_get_snap_coord(sxs[j])
    return null

  scy: (i, sx, sy) ->
    if @renderer.syss[i].length is 1
      # We don't have discontinuous objects so we're ok
      return @_get_snap_coord(@sys[i])
    else
      # We have discontinuous objects, so we need to find which
      # one we're in, we can use point_in_poly again
      sxs = @renderer.sxss[i]
      sys = @renderer.syss[i]
      for j in [0...sxs.length]
        if hittest.point_in_poly(sx, sy, sxs[j], sys[j])
          return @_get_snap_coord(sys[j])

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    @_generic_area_legend(ctx, x0, x1, y0, y1, index)

export class Patches extends Glyph
  default_view: PatchesView

  type: 'Patches'

  @coords [ ['xs', 'ys'] ]
  @mixins ['line', 'fill']
