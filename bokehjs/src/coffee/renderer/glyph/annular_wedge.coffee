define [
  "underscore"
  "common/mathutils"
  "./glyph"
], (_, mathutils, Glyph) ->

  class AnnularWedgeView extends Glyph.View

    _set_data: () ->
      @max_radius = _.max(@outer_radius)
      @_xy_index()

    _map_data: () ->
      [@sx, @sy] = @renderer.map_to_screen(@x, @y)
      @inner_radius = @distance_vector('x', 'inner_radius', 'edge')
      @outer_radius = @distance_vector('x', 'outer_radius', 'edge')
      @angle = new Float32Array(@start_angle.length)
      for i in [0...@start_angle.length]
        @angle[i] = @end_angle[i] - @start_angle[i]

    _render: (ctx, indices, sx=@sx, sy=@sy, inner_radius=@inner_radius, outer_radius=@outer_radius) ->
      for i in indices
        if isNaN(sx[i] + sy[i] + inner_radius[i] + outer_radius[i] + @start_angle[i] + @angle[i])
          continue

        ctx.translate(sx[i], sy[i])
        ctx.rotate(@start_angle[i])

        ctx.moveTo(outer_radius[i], 0)
        ctx.beginPath()
        ctx.arc(0, 0, outer_radius[i], 0, @angle[i], @direction[i])
        ctx.rotate(@angle[i])
        ctx.lineTo(inner_radius[i], 0)
        ctx.arc(0, 0, inner_radius[i], 0, -@angle[i], not @direction[i])
        ctx.closePath()

        ctx.rotate(-@angle[i]-@start_angle[i])
        ctx.translate(-sx[i], -sy[i])

        if @props.fill.do_fill
          @props.fill.set_vectorize(ctx, i)
          ctx.fill()

        if @props.line.do_stroke
          @props.line.set_vectorize(ctx, i)
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
        or2 = Math.pow(@outer_radius[i], 2)
        ir2 = Math.pow(@inner_radius[i], 2)
        sx0 = @renderer.xmapper.map_to_target(x)
        sx1 = @renderer.xmapper.map_to_target(@x[i])
        sy0 = @renderer.ymapper.map_to_target(y)
        sy1 = @renderer.ymapper.map_to_target(@y[i])
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

      r = Math.min(Math.abs(x1-x0), Math.abs(y1-y0)) * 0.5
      inner_radius = { }
      inner_radius[reference_point] = r*0.25
      outer_radius = { }
      outer_radius[reference_point] = r*0.8

      @_render(ctx, indices, sx, sy, inner_radius, outer_radius)

  class AnnularWedge extends Glyph.Model
    default_view: AnnularWedgeView
    type: 'AnnularWedge'
    distances: ['inner_radius', 'outer_radius']
    angles: ['start_angle', 'end_angle']
    fields: ['direction:string']

    display_defaults: ->
      return _.extend {}, super(), {
        direction: 'anticlock'
      }

  class AnnularWedges extends Glyph.Collection
    model: AnnularWedge

  return {
    Model: AnnularWedge
    View: AnnularWedgeView
    Collection: new AnnularWedges()
  }
