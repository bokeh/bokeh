_ = require "underscore"
Glyph = require "./glyph"
rbush = require "rbush"
hittest = require "../../common/hittest"

class PatchesView extends Glyph.View

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
      qs = _.toArray(nanned_qs[i])
      while qs.length > 0

        nan_index = _.findLastIndex(qs, (q) ->  _.isNaN(q))

        if nan_index >= 0
          qs_part = qs.splice(nan_index)
        else
          qs_part = qs
          qs = []

        denanned = (q for q in qs_part when not _.isNaN(q))
        ds[i].push(denanned)
    return ds


  _index_data: () ->
    index = rbush()
    pts = []
    xss = @_build_discontinuous_object(@xs)
    yss = @_build_discontinuous_object(@ys)

    for i in [0...@xs.length]
      for j in [0...xss[i].length]
        xs = xss[i][j]
        ys = yss[i][j]
        if xs.length == 0
          continue
        pts.push([
          _.min(xs), _.min(ys),
          _.max(xs), _.max(ys),
          {'i': i}
        ])
    index.load(pts)
    return index

  _mask_data: (all_indices) ->
    xr = @renderer.plot_view.x_range
    [x0, x1] = [xr.get('min'), xr.get('max')]

    yr = @renderer.plot_view.y_range
    [y0, y1] = [yr.get('min'), yr.get('max')]

    return (x[4].i for x in @index.search([x0, y0, x1, y1]))

  _render: (ctx, indices, {sxs, sys}) ->
    # @sxss and @syss are used by _hit_point and sxc, syc
    # This is the earliest we can build them, and only build them once
    @sxss = @_build_discontinuous_object(sxs)
    @syss = @_build_discontinuous_object(sys)
    for i in indices
      [sx, sy] = [sxs[i], sys[i]]

      if @visuals.fill.do_fill
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

      if @visuals.line.do_stroke
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

    x = @renderer.xmapper.map_from_target(vx, true)
    y = @renderer.ymapper.map_from_target(vy, true)

    candidates = (x[4].i for x in @index.search([x, y, x, y]))

    hits = []
    for i in [0...candidates.length]
      idx = candidates[i]
      sxs = @sxss[idx]
      sys = @syss[idx]
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
    if @sxss[i].length is 1
      # We don't have discontinuous objects so we're ok
      return @_get_snap_coord(@sxs[i])
    else
      # We have discontinuous objects, so we need to find which
      # one we're in, we can use point_in_poly again
      sxs = @sxss[i]
      sys = @syss[i]
      for j in [0...sxs.length]
        if hittest.point_in_poly(sx, sy, sxs[j], sys[j])
          return @_get_snap_coord(sxs[j])
    return null

  scy: (i, sx, sy) ->
    if @syss[i].length is 1
      # We don't have discontinuous objects so we're ok
      return @_get_snap_coord(@sys[i])
    else
      # We have discontinuous objects, so we need to find which
      # one we're in, we can use point_in_poly again
      sxs = @sxss[i]
      sys = @syss[i]
      for j in [0...sxs.length]
        if hittest.point_in_poly(sx, sy, sxs[j], sys[j])
          return @_get_snap_coord(sys[j])

  draw_legend: (ctx, x0, x1, y0, y1) ->
    @_generic_area_legend(ctx, x0, x1, y0, y1)

class Patches extends Glyph.Model
  default_view: PatchesView
  type: 'Patches'
  coords: [ ['xs', 'ys'] ]

module.exports =
  Model: Patches
  View: PatchesView
