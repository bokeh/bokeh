_ = require "underscore"
mathutils = require "../../common/mathutils"
Glyph = require "./glyph"
hittest = require "../../common/hittest"

class AnnularWedgeView extends Glyph.View

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
    @angle = new Float32Array(@start_angle.length)
    for i in [0...@start_angle.length]
      @angle[i] = @end_angle[i] - @start_angle[i]

  _render: (ctx, indices, {sx, sy, start_angle, angle, sinner_radius, souter_radius, direction}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+sinner_radius[i]+souter_radius[i]+start_angle[i]+angle[i]+direction[i])
        continue

      ctx.translate(sx[i], sy[i])
      ctx.rotate(@start_angle[i])

      ctx.moveTo(souter_radius[i], 0)
      ctx.beginPath()
      ctx.arc(0, 0, souter_radius[i], 0, angle[i], direction[i])
      ctx.rotate(@angle[i])
      ctx.lineTo(sinner_radius[i], 0)
      ctx.arc(0, 0, sinner_radius[i], 0, -angle[i], not direction[i])
      ctx.closePath()

      ctx.rotate(-angle[i]-start_angle[i])
      ctx.translate(-sx[i], -sy[i])

      if @visuals.fill.do_fill
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.do_stroke
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

  _hit_point: (geometry) ->
    [vx, vy] = [geometry.vx, geometry.vy]
    x = @renderer.xmapper.map_from_target(vx, true)
    y = @renderer.ymapper.map_from_target(vy, true)

    # check radius first
    if @distances.outer_radius.units == "data"
      x0 = x - @max_outer_radius
      x1 = x + @max_outer_radius

      y0 = y - @max_outer_radius
      y1 = y + @max_outer_radius

    else
      vx0 = vx - @max_outer_radius
      vx1 = vx + @max_outer_radius
      [x0, x1] = @renderer.xmapper.v_map_from_target([vx0, vx1], true)

      vy0 = vy - @max_outer_radius
      vy1 = vy + @max_outer_radius
      [y0, y1] = @renderer.ymapper.v_map_from_target([vy0, vy1], true)

    candidates = []
    for i in (pt[4].i for pt in @index.search([x0, y0, x1, y1]))
      or2 = Math.pow(@souter_radius[i], 2)
      ir2 = Math.pow(@sinner_radius[i], 2)
      sx0 = @renderer.xmapper.map_to_target(x, true)
      sx1 = @renderer.xmapper.map_to_target(@x[i], true)
      sy0 = @renderer.ymapper.map_to_target(y, true)
      sy1 = @renderer.ymapper.map_to_target(@y[i], true)
      dist = Math.pow(sx0-sx1, 2) + Math.pow(sy0-sy1, 2)
      if dist <= or2 and dist >= ir2
        candidates.push([i, dist])

    hits = []
    for [i, dist] in candidates
      sx = @renderer.plot_view.canvas.vx_to_sx(vx)
      sy = @renderer.plot_view.canvas.vy_to_sy(vy)
      # NOTE: minus the angle because JS uses non-mathy convention for angles
      angle = Math.atan2(sy-@sy[i], sx-@sx[i])
      if mathutils.angle_between(-angle, -@start_angle[i], -@end_angle[i], @direction[i])
        hits.push([i, dist])

    result = hittest.create_hit_test_result()
    result['1d'].indices = _.chain(hits)
      .sortBy((elt) -> return elt[1])
      .map((elt) -> return elt[0])
      .value()
    return result

  draw_legend: (ctx, x0, x1, y0, y1) ->
    @_generic_area_legend(ctx, x0, x1, y0, y1)

class AnnularWedge extends Glyph.Model
  default_view: AnnularWedgeView
  type: 'AnnularWedge'
  distances: ['inner_radius', 'outer_radius']
  angles: ['start_angle', 'end_angle']
  fields: ['direction:direction']

  display_defaults: ->
    return _.extend {}, super(), {
      direction: 'anticlock'
    }

module.exports =
  Model: AnnularWedge
  View: AnnularWedgeView
