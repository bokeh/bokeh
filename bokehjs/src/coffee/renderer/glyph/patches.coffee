_ = require "underscore"
Glyph = require "./glyph"
rbush = require "rbush"
hittest = require "../../common/hittest"

class PatchesView extends Glyph.View

  _index_data: () ->
    index = rbush()
    pts = []
    for i in [0...@xs.length]

      xs = @xs[i]
      ys = @ys[i]

      while xs.length > 0

        xs_nan_index = _.findLastIndex(xs, (x) ->  _.isNaN(x))
        ys_nan_index = _.findLastIndex(ys, (y) ->  _.isNaN(y))
        
        if xs_nan_index >= 0
          xs_loop = xs.splice(xs_nan_index)
        else
          xs_loop = xs
          xs = []

        if ys_nan_index >= 0
          ys_loop = ys.splice(ys_nan_index)
        else
          ys_loop = ys
          ys = []

        xs_push = (x for x in xs_loop when not _.isNaN(x))
        ys_push = (y for y in ys_loop when not _.isNaN(y))
        pts.push([
          _.min(xs_push), _.min(ys_push),
          _.max(xs_push), _.max(ys_push),
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
      if hittest.point_in_poly(sx, sy, @sxs[idx], @sys[idx])
        hits.push(idx)

    result = hittest.create_hit_test_result()
    result['1d'].indices = hits
    return result

  scx: (i) ->
    sum = 0
    for sx in @sxs[i]
      sum += sx
    return sum / @sxs[i].length

  scy: (i) ->
    sum = 0
    for sy in @sys[i]
      sum += sy
    return sum / @sys[i].length

  draw_legend: (ctx, x0, x1, y0, y1) ->
    @_generic_area_legend(ctx, x0, x1, y0, y1)

class Patches extends Glyph.Model
  default_view: PatchesView
  type: 'Patches'
  coords: [ ['xs', 'ys'] ]

module.exports =
  Model: Patches
  View: PatchesView
