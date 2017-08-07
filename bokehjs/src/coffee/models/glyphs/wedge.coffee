import {XYGlyph, XYGlyphView} from "./xy_glyph"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {angle_between} from "core/util/math"

export class WedgeView extends XYGlyphView

  _map_data: () ->
    if @model.properties.radius.units == "data"
      @sradius = @sdist(@renderer.xscale, @_x, @_radius)
    else
      @sradius = @_radius

  _render: (ctx, indices, {sx, sy, sradius, _start_angle, _end_angle}) ->
    direction = @model.properties.direction.value()
    for i in indices
      if isNaN(sx[i]+sy[i]+sradius[i]+_start_angle[i]+_end_angle[i])
        continue

      ctx.beginPath()
      ctx.arc(sx[i], sy[i], sradius[i], _start_angle[i], _end_angle[i], direction)
      ctx.lineTo(sx[i], sy[i])
      ctx.closePath()

      if @visuals.fill.doit
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.doit
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

  _hit_point: (geometry) ->
    [vx, vy] = [geometry.vx, geometry.vy]
    x = @renderer.xscale.invert(vx)
    y = @renderer.yscale.invert(vy)

    # check radius first
    if @model.properties.radius.units == "data"
      x0 = x - @max_radius
      x1 = x + @max_radius

      y0 = y - @max_radius
      y1 = y + @max_radius

    else
      vx0 = vx - @max_radius
      vx1 = vx + @max_radius
      [x0, x1] = @renderer.xscale.v_invert([vx0, vx1])

      vy0 = vy - @max_radius
      vy1 = vy + @max_radius
      [y0, y1] = @renderer.yscale.v_invert([vy0, vy1])

    candidates = []

    bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    for i in @index.indices(bbox)
      r2 = Math.pow(@sradius[i], 2)
      sx0 = @renderer.xscale.compute(x)
      sx1 = @renderer.xscale.compute(@_x[i])
      sy0 = @renderer.yscale.compute(y)
      sy1 = @renderer.yscale.compute(@_y[i])
      dist = Math.pow(sx0-sx1, 2) + Math.pow(sy0-sy1, 2)
      if dist <= r2
        candidates.push([i, dist])

    direction = @model.properties.direction.value()
    hits = []
    for [i, dist] in candidates
      sx = @renderer.plot_view.canvas.vx_to_sx(vx)
      sy = @renderer.plot_view.canvas.vy_to_sy(vy)
      # NOTE: minus the angle because JS uses non-mathy convention for angles
      angle = Math.atan2(sy-@sy[i], sx-@sx[i])
      if angle_between(-angle, -@_start_angle[i], -@_end_angle[i], direction)
        hits.push([i, dist])

    return hittest.create_1d_hit_test_result(hits)

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    @_generic_area_legend(ctx, x0, x1, y0, y1, index)

export class Wedge extends XYGlyph
  default_view: WedgeView

  type: 'Wedge'

  @mixins ['line', 'fill']
  @define {
      direction:    [ p.Direction,   'anticlock' ]
      radius:       [ p.DistanceSpec             ]
      start_angle:  [ p.AngleSpec                ]
      end_angle:    [ p.AngleSpec                ]
    }
