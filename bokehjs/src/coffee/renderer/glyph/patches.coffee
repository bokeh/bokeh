_ = require "underscore"
Glyph = require "./glyph"
rbush = require "rbush"
hittest = require "../../common/hittest"

class PatchesView extends Glyph.View

  _index_data: () ->
    index = rbush()
    pts = []
    for i in [0...@xs.length]
      xs = (x for x in @xs[i] when not _.isNaN(x))
      ys = (y for y in @ys[i] when not _.isNaN(y))
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
    [x0, x1] = [xr.get('start'), xr.get('end')]

    yr = @renderer.plot_view.y_range
    [y0, y1] = [yr.get('start'), yr.get('end')]

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
    return hits

  draw_legend: (ctx, x0, x1, y0, y1) ->
    @_generic_area_legend(ctx, x0, x1, y0, y1)

class Patches extends Glyph.Model
  default_view: PatchesView
  type: 'Patches'
  coords: [ ['xs', 'ys'] ]

module.exports =
  Model: Patches
  View: PatchesView