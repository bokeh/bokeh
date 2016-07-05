_ = require "underscore"

Glyph = require "./glyph"
hittest = require "../../common/hittest"
p = require "../../core/properties"
{angle_between} = require "../../core/util/math"

class WedgeView extends Glyph.View

  _index_data: () ->
    @_xy_index()

  _map_data: () ->
    if @model.properties.radius.units == "data"
      @sradius = @sdist(@renderer.xmapper, @_x, @_radius)
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
    x = @renderer.xmapper.map_from_target(vx, true)
    y = @renderer.ymapper.map_from_target(vy, true)

    # check radius first
    if @model.properties.radius.units == "data"
      x0 = x - @max_radius
      x1 = x + @max_radius

      y0 = y - @max_radius
      y1 = y + @max_radius

    else
      vx0 = vx - @max_radius
      vx1 = vx + @max_radius
      [x0, x1] = @renderer.xmapper.v_map_from_target([vx0, vx1], true)

      vy0 = vy - @max_radius
      vy1 = vy + @max_radius
      [y0, y1] = @renderer.ymapper.v_map_from_target([vy0, vy1], true)

    candidates = []

    bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    for i in (pt.i for pt in @index.search(bbox))
      r2 = Math.pow(@sradius[i], 2)
      sx0 = @renderer.xmapper.map_to_target(x, true)
      sx1 = @renderer.xmapper.map_to_target(@_x[i], true)
      sy0 = @renderer.ymapper.map_to_target(y, true)
      sy1 = @renderer.ymapper.map_to_target(@_y[i], true)
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

    result = hittest.create_hit_test_result()
    result['1d'].indices = _.chain(hits)
      .sortBy((elt) -> return elt[1])
      .map((elt) -> return elt[0])
      .value()
    return result

  draw_legend: (ctx, x0, x1, y0, y1) ->
    @_generic_area_legend(ctx, x0, x1, y0, y1)

class Wedge extends Glyph.Model
  default_view: WedgeView

  type: 'Wedge'

  @coords [['x', 'y']]
  @mixins ['line', 'fill']
  @define {
      direction:    [ p.Direction,   'anticlock' ]
      radius:       [ p.DistanceSpec             ]
      start_angle:  [ p.AngleSpec                ]
      end_angle:    [ p.AngleSpec                ]
    }

module.exports =
  Model: Wedge
  View: WedgeView
