define [
  "underscore"
  "common/mathutils"
  "./glyph"
], (_, mathutils, Glyph) ->

  class WedgeView extends Glyph.View

    _index_data: () ->
      @_xy_index()

    _map_data: () ->
      @sradius = @sdist(@renderer.xmapper, @x, @radius)

    _render: (ctx, indices, sx=@sx, sy=@sy, sradius=@sradius) ->
      for i in indices
        if isNaN(sx[i] + sy[i] + sradius[i] + @start_angle[i] + @end_angle[i] + @direction[i])
          continue

        ctx.beginPath()
        ctx.arc(sx[i], sy[i], sradius[i], @start_angle[i], @end_angle[i], @direction[i])
        ctx.lineTo(sx[i], sy[i])
        ctx.closePath()

        if @visuals.fill.do_fill
          @visuals.fill.set_vectorize(ctx, i)
          ctx.fill()

        if @visuals.line.do_stroke
          @visuals.line.set_vectorize(ctx, i)
          ctx.stroke()

    _hit_point: (geometry) ->
      [vx, vy] = [geometry.vx, geometry.vy]
      x = @renderer.xmapper.map_from_target(vx)
      x0 = x - @max_radius
      x1 = x + @max_radius

      y = @renderer.ymapper.map_from_target(vy)
      y0 = y - @max_radius
      y1 = y + @max_radius

      candidates = []
      for i in (pt[4].i for pt in @index.search([x0, y0, x1, y1]))
        r2 = Math.pow(@radius[i], 2)
        sx0 = @renderer.xmapper.map_to_target(x)
        sx1 = @renderer.xmapper.map_to_target(@x[i])
        sy0 = @renderer.ymapper.map_to_target(y)
        sy1 = @renderer.ymapper.map_to_target(@y[i])
        dist = Math.pow(sx0-sx1, 2) + Math.pow(sy0-sy1, 2)
        if dist <= r2
          candidates.push([i, dist])

      hits = []
      for [i, dist] in candidates
        sx = @renderer.plot_view.canvas.vx_to_sx(vx)
        sy = @renderer.plot_view.canvas.vy_to_sy(vy)
        # NOTE: minus the angle because JS uses non-mathy convention for angles
        angle = Math.atan2(sy-@sy[i], sx-@sx[i])
        if mathutils.angle_between(-angle, -@start_angle[i], -@end_angle[i], @direction[i])
          hits.push([i, dist])

      hits = _.chain(hits)
        .sortBy((elt) -> return elt[1])
        .map((elt) -> return elt[0])
        .value()
      return hits

    draw_legend: (ctx, x0, x1, y0, y1) ->
      reference_point = @get_reference_point() ? 0

      indices = [reference_point]
      sx = { }
      sx[reference_point] = (x0+x1)/2
      sy = { }
      sy[reference_point] = (y0+y1)/2

      sradius = { }
      sradius[reference_point] = Math.min(Math.abs(x1-x0), Math.abs(y1-y0)) * 0.4

      @_render(ctx, indices, sx, sy, sradius)

  class Wedge extends Glyph.Model
    default_view: WedgeView
    type: 'Wedge'
    distances: ['radius']
    angles: ['start_angle', 'end_angle']
    fields: ['direction:direction']

    display_defaults: ->
      return _.extend {}, super(), {
        direction: 'anticlock'
      }

  class Wedges extends Glyph.Collection
    model: Wedge

  return {
    Model: Wedge
    View: WedgeView
    Collection: new Wedges()
  }
