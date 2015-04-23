_ = require "underscore"
Glyph = require "./glyph"
hittest = require "../../common/hittest"

class AnnulusView extends Glyph.View

  _index_data: () ->
    @_xy_index()

  _map_data: () ->
    if @distances.inner_radius.units == "data"
      @sinner_radius = @sdist(@renderer.xmapper, @x, @inner_radius)
    else
      @sinner_radius = @inner_radius
    if @distances.outer_radius.units == "data"
      @souter_radius = @sdist(@renderer.xmapper, @x, @outer_radius)
    else
      @souter_radius = @outer_radius

  _render: (ctx, indices, {sx, sy, sinner_radius, souter_radius}) ->
    for i in indices
      if isNaN(sx[i] + sy[i] + sinner_radius[i] + souter_radius[i])
        continue

      ctx.beginPath()
      ctx.arc(sx[i], sy[i], sinner_radius[i], 0, 2*Math.PI*2, false)
      ctx.moveTo(sx[i]+souter_radius[i], sy[i])
      ctx.arc(sx[i], sy[i], souter_radius[i], 0, 2*Math.PI*2, true)

      if @visuals.fill.do_fill
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.do_stroke
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

  _hit_point: (geometry) ->
    [vx, vy] = [geometry.vx, geometry.vy]
    x = @renderer.xmapper.map_from_target(vx, true)
    x0 = x - @max_radius
    x1 = x + @max_radius

    y = @renderer.ymapper.map_from_target(vy, true)
    y0 = y - @max_radius
    y1 = y + @max_radius

    hits = []
    for i in (pt[4].i for pt in @index.search([x0, y0, x1, y1]))
      or2 = Math.pow(@souter_radius[i], 2)
      ir2 = Math.pow(@sinner_radius[i], 2)
      sx0 = @renderer.xmapper.map_to_target(x)
      sx1 = @renderer.xmapper.map_to_target(@x[i])
      sy0 = @renderer.ymapper.map_to_target(y)
      sy1 = @renderer.ymapper.map_to_target(@y[i])
      dist = Math.pow(sx0-sx1, 2) + Math.pow(sy0-sy1, 2)
      if dist <= or2 and dist >= ir2
        hits.push([i, dist])

    result = hittest.create_hit_test_result()
    result['1d'].indices = _.chain(hits)
      .sortBy((elt) -> return elt[1])
      .map((elt) -> return elt[0])
      .value()
    return result

  draw_legend: (ctx, x0, x1, y0, y1) ->
    reference_point = @get_reference_point() ? 0

    indices = [reference_point]
    sx = { }
    sx[reference_point] = (x0+x1)/2
    sy = { }
    sy[reference_point] = (y0+y1)/2

    r = Math.min(Math.abs(x1-x0), Math.abs(y1-y0)) * 0.5
    sinner_radius = { }
    sinner_radius[reference_point] = r*0.4
    souter_radius = { }
    souter_radius[reference_point] = r*0.8

    data = {sx: sx, sy: sy, sinner_radius: sinner_radius, souter_radius: souter_radius}

    @_render(ctx, indices, data)

class Annulus extends Glyph.Model
  default_view: AnnulusView
  type: 'Annulus'
  distances: ['inner_radius', 'outer_radius']

module.exports =
  Model: Annulus
  View: AnnulusView