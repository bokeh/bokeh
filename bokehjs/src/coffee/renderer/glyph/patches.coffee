_ = require "underscore"
Glyph = require "./glyph"
rbush = require "rbush"
hittest = require "../../common/hittest"

class PatchesView extends Glyph.View

  _build_discontinuous_object: (nanned_qs) ->
    # _s is @xs, @ys, @sxs, @sys
    # an object of n 1-d arrays in either data or screen units
    #
    # Each 1-d array gets broken to an array of arrays split on any NaNs
    #
    # So:
    # { 0: [x11, x12],
    #   1: [x21, x22, x23],
    #   2: [x31, NaN, x32]
    #   3: [[[x41],[x42]], NaN, x43]
    # }
    # becomes
    # { 0: [[x11, x12]],
    #   1: [[x21, x22, x23]],
    #   2: [[x31],[x32]]
    #   3: [[[x41], [x42]], [x43]]
    # }
    ds = {}
    for i in [0...nanned_qs.length]
      ds[i] = []

      qs = _.toArray(nanned_qs[i]) # This converts a Float64Array back to a normal array so can splice

      while qs.length > 0
        nan_index = _.findLastIndex(qs, (q) -> _.isNaN(q))
        if nan_index >= 0
          qs_part = qs.splice(nan_index)
        else
          qs_part = qs
          qs = []

        denanned = (q for q in qs_part when (not _.isNaN(q)))
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
        if not _.isArray(xs[0])
          xs_array = xs
          ys_array = ys
        if _.isArray(xs[0])
          xs_array = _.flatten(xs)
          ys_array = _.flatten(ys)
        pts.push([
          _.min(xs_array), _.min(ys_array),
          _.max(xs_array), _.max(ys_array),
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

  _render_polygon_with_hole: (ctx, sx_arrays, sy_arrays, fill_or_stroke) ->
    ctx.beginPath()
    for i in [0...sx_arrays[0].length]
      sx = sx_arrays[0][i]
      sy = sy_arrays[0][i]
      for j in [0...sx.length]
        if j == 0
          ctx.moveTo(sx[j], sy[j])
          continue
        else
          ctx.lineTo(sx[j], sy[j])
      ctx.closePath()
    if fill_or_stroke == 'fill'
      ctx.fill()
    if fill_or_stroke == 'stroke'
      ctx.stroke()

  _render_polygon_no_hole: (ctx, sx, sy, fill_or_stroke) ->
    for j in [0...sx.length]
      if j == 0
        ctx.beginPath()
        ctx.moveTo(sx[j], sy[j])
        continue
      else
        ctx.lineTo(sx[j], sy[j])
    ctx.closePath()
    if fill_or_stroke == 'fill'
      ctx.fill()
    if fill_or_stroke == 'stroke'
      ctx.stroke()

  __de_nan_vector: (qs) ->
    # Takes [1, 2, 3, NaN, 4, 5] and returns [[1, 2, 3], [4, 5]]
    result = []
    qs = _.toArray(qs) # This converts a Float64Array back to a normal array so can splice
    while qs.length > 0
      nan_index = _.findLastIndex(qs, (q) -> _.isNaN(q))
      if nan_index >= 0
        qs_part = qs.splice(nan_index)
      else
        qs_part = qs
        qs = []

      denanned = (q for q in qs_part when (not _.isNaN(q)))
      result.push(_.toArray(denanned))
    return result

  _render_polygon: (ctx, sx, sy, fill_or_stroke) ->
    if _.isNumber(sx[0])
      @_render_polygon_no_hole(ctx, sx, sy, fill_or_stroke)
    else
      @_render_polygon_with_hole(ctx, sx, sy, fill_or_stroke)

  _render: (ctx, indices, {sxs, sys}) ->
    # @sxss and @syss are used by _hit_point and sxc, syc
    # This is the earliest we can build them, and only build them once
    @sxss = @_build_discontinuous_object(sxs)
    @syss = @_build_discontinuous_object(sys)
    for i in indices
      [sx, sy] = [sxs[i], sys[i]]

      is_discontinuous = false
      if _.some(sx, _.isNaN)
        is_discontinuous = true
        # Handle discontinuous patches
        denanned_xs = @__de_nan_vector(sx)
        denanned_xy = @__de_nan_vector(sy)

      if @visuals.fill.do_fill
        @visuals.fill.set_vectorize(ctx, i)

        if is_discontinuous
          for i in [0...denanned_xs.length]
            @_render_polygon(ctx, denanned_xs[i], denanned_xy[i], 'fill') 
        else
          @_render_polygon(ctx, sx, sy, 'fill')

      if @visuals.line.do_stroke
        @visuals.line.set_vectorize(ctx, i)

        if is_discontinuous
          for i in [0...denanned_xs.length]
            @_render_polygon(ctx, denanned_xs[i], denanned_xy[i], 'stroke') 
        else
          @_render_polygon(ctx, sx, sy, 'stroke')


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
        if _.isNumber(sxs[j][0])
          if hittest.point_in_poly(sx, sy, sxs[j], sys[j])
            hits.push(idx)
        else
          if hittest.point_in_poly_with_hole(sx, sy, sxs[j][0], sys[j][0])
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
