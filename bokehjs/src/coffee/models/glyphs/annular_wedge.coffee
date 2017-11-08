import {XYGlyph, XYGlyphView} from "./xy_glyph"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {angle_between} from "core/util/math"

export class AnnularWedgeView extends XYGlyphView

  _map_data: () ->
    if @model.properties.inner_radius.units == "data"
      @sinner_radius = @sdist(@renderer.xscale, @_x, @_inner_radius)
    else
      @sinner_radius = @_inner_radius
    if @model.properties.outer_radius.units == "data"
      @souter_radius = @sdist(@renderer.xscale, @_x, @_outer_radius)
    else
      @souter_radius = @_outer_radius
    @_angle = new Float32Array(@_start_angle.length)
    for i in [0...@_start_angle.length]
      @_angle[i] = @_end_angle[i] - @_start_angle[i]

  _render: (ctx, indices, {sx, sy, _start_angle, _angle, sinner_radius, souter_radius}) ->
    direction = @model.properties.direction.value()
    for i in indices
      if isNaN(sx[i]+sy[i]+sinner_radius[i]+souter_radius[i]+_start_angle[i]+_angle[i])
        continue

      ctx.translate(sx[i], sy[i])
      ctx.rotate(_start_angle[i])

      ctx.moveTo(souter_radius[i], 0)
      ctx.beginPath()
      ctx.arc(0, 0, souter_radius[i], 0, _angle[i], direction)
      ctx.rotate(_angle[i])
      ctx.lineTo(sinner_radius[i], 0)
      ctx.arc(0, 0, sinner_radius[i], 0, -_angle[i], not direction)
      ctx.closePath()

      ctx.rotate(-_angle[i]-_start_angle[i])
      ctx.translate(-sx[i], -sy[i])

      if @visuals.fill.doit
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.doit
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

  _hit_point: (geometry) ->
    {sx, sy} = geometry
    x = @renderer.xscale.invert(sx)
    y = @renderer.yscale.invert(sy)

    # check radius first
    if @model.properties.outer_radius.units == "data"
      x0 = x - @max_outer_radius
      x1 = x + @max_outer_radius

      y0 = y - @max_outer_radius
      y1 = y + @max_outer_radius

    else
      sx0 = sx - @max_outer_radius
      sx1 = sx + @max_outer_radius
      [x0, x1] = @renderer.xscale.r_invert(sx0, sx1)

      sy0 = sy - @max_outer_radius
      sy1 = sy + @max_outer_radius
      [y0, y1] = @renderer.yscale.r_invert(sy0, sy1)

    candidates = []

    bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    for i in @index.indices(bbox)
      or2 = Math.pow(@souter_radius[i], 2)
      ir2 = Math.pow(@sinner_radius[i], 2)
      [sx0, sx1] = @renderer.xscale.r_compute(x, @_x[i])
      [sy0, sy1] = @renderer.yscale.r_compute(y, @_y[i])
      dist = Math.pow(sx0-sx1, 2) + Math.pow(sy0-sy1, 2)
      if dist <= or2 and dist >= ir2
        candidates.push([i, dist])

    direction = @model.properties.direction.value()
    hits = []
    for [i, dist] in candidates
      # NOTE: minus the angle because JS uses non-mathy convention for angles
      angle = Math.atan2(sy-@sy[i], sx-@sx[i])
      if angle_between(-angle, -@_start_angle[i], -@_end_angle[i], direction)
        hits.push([i, dist])

    return hittest.create_1d_hit_test_result(hits)

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    @_generic_area_legend(ctx, x0, x1, y0, y1, index)

  _scxy: (i) ->
    r = (@sinner_radius[i] + @souter_radius[i])/2
    a = (@_start_angle[i]  + @_end_angle[i])   /2
    return {x: @sx[i] + r*Math.cos(a), y: @sy[i] + r*Math.sin(a)}

  scx: (i) -> @_scxy(i).x
  scy: (i) -> @_scxy(i).y

export class AnnularWedge extends XYGlyph
  default_view: AnnularWedgeView

  type: 'AnnularWedge'

  @mixins ['line', 'fill']
  @define {
      direction:    [ p.Direction,   'anticlock' ]
      inner_radius: [ p.DistanceSpec             ]
      outer_radius: [ p.DistanceSpec             ]
      start_angle:  [ p.AngleSpec                ]
      end_angle:    [ p.AngleSpec                ]
    }
