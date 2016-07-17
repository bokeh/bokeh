_ = require "underscore"

Glyph = require "./glyph"
hittest = require "../../common/hittest"

p = require "../../core/properties"


class HexagonView extends Glyph.View

  _index_data: () ->
    return @_xy_index()

  # set the size of the glyph, either using diagonal or size
  _map_data: () ->
    # NOTE: Order is important here: size is always present (at least
    # a default), but diagonal is only present if a user specifies it
    if @_diagonal?
      if @model.properties.diagonal.spec.units == "data"
        rd = @model.properties.diagonal_dimension.spec.value
        @sdiagonal = @sdist(@renderer["#{rd}mapper"], @["_"+rd], @_diagonal)
      else
        @sdiagonal = @_diagonal
        @max_size = @max_diagonal
    else
      @sdiagonal = (s for s in @_size)

#   # mask some/the data?
#   _mask_data: (all_indices) ->
#     hr = @renderer.plot_view.frame.get('h_range')
#     vr = @renderer.plot_view.frame.get('v_range')
#
#     # check for diagonal first
#     if @_diagonal? and @model.properties.diagonal.units == "data"
#       sx0 = hr.get('start')
#       sx1 = hr.get('end')
#       [x0, x1] = @renderer.xmapper.v_map_from_target([sx0, sx1], true)
#       x0 -= @max_diagonal
#       x1 += @max_diagonal
#
#       sy0 = vr.get('start')
#       sy1 = vr.get('end')
#       [y0, y1] = @renderer.ymapper.v_map_from_target([sy0, sy1], true)
#       y0 -= @max_diagonal
#       y1 += @max_diagonal
#
#     else
#       sx0 = hr.get('start') - @max_size
#       sx1 = hr.get('end') + @max_size
#       [x0, x1] = @renderer.xmapper.v_map_from_target([sx0, sx1], true)
#
#       sy0 = vr.get('start') - @max_size
#       sy1 = vr.get('end') + @max_size
#       [y0, y1] = @renderer.ymapper.v_map_from_target([sy0, sy1], true)
#
#     bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
#     return (x.i for x in @index.search(bbox))

  # draw the glyph
  _render: (ctx, indices, {sx, sy, sdiagonal}) ->

    for i in indices
      if isNaN(sx[i]+sy[i]+sdiagonal[i])
        continue

      ctx.beginPath()
      ctx.moveTo(-0.3*sdiagonal[i], -0.4*sdiagonal[i]);
      ctx.lineTo(0.3*sdiagonal[i], -0.4*sdiagonal[i]);
      ctx.lineTo(110, 0);
      ctx.lineTo(0.3*sdiagonal[i], 0.4*sdiagonal[i]);
      ctx.lineTo(-0.3*sdiagonal[i], 0.4*sdiagonal[i]);
      ctx.lineTo(0,  0)
      # ctx.arc(sx[i], sy[i], sdiagonal[i], 0, 2*Math.PI, false)

      if @visuals.fill.doit
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.doit
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

#   # define if the mouse is inside a glyph
#   _hit_point: (geometry) ->
#     [vx, vy] = [geometry.vx, geometry.vy]
#     x = @renderer.xmapper.map_from_target(vx, true)
#     y = @renderer.ymapper.map_from_target(vy, true)
#
#     # check diagonal first
#     if @_diagonal? and @model.properties.diagonal.units == "data"
#       x0 = x - @max_diagonal
#       x1 = x + @max_diagonal
#
#       y0 = y - @max_diagonal
#       y1 = y + @max_diagonal
#
#     else
#       vx0 = vx - @max_size
#       vx1 = vx + @max_size
#       [x0, x1] = @renderer.xmapper.v_map_from_target([vx0, vx1], true)
#       [x0, x1] = [Math.min(x0, x1), Math.max(x0, x1)]
#
#       vy0 = vy - @max_size
#       vy1 = vy + @max_size
#       [y0, y1] = @renderer.ymapper.v_map_from_target([vy0, vy1], true)
#       [y0, y1] = [Math.min(y0, y1), Math.max(y0, y1)]
#
#     bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
#     candidates = (pt.i for pt in @index.search(bbox))
#
#     hits = []
#     if @_diagonal? and @model.properties.diagonal.units == "data"
#       for i in candidates
#         r2 = Math.pow(@sdiagonal[i], 2)
#         sx0 = @renderer.xmapper.map_to_target(x, true)
#         sx1 = @renderer.xmapper.map_to_target(@_x[i], true)
#         sy0 = @renderer.ymapper.map_to_target(y, true)
#         sy1 = @renderer.ymapper.map_to_target(@_y[i], true)
#         dist = Math.pow(sx0-sx1, 2) + Math.pow(sy0-sy1, 2)
#         if dist <= r2
#           hits.push([i, dist])
#     else
#       sx = @renderer.plot_view.canvas.vx_to_sx(vx)
#       sy = @renderer.plot_view.canvas.vy_to_sy(vy)
#       for i in candidates
#         r2 = Math.pow(@sdiagonal[i], 2)
#         dist = Math.pow(@sx[i]-sx, 2) + Math.pow(@sy[i]-sy, 2)
#         if dist <= r2
#           hits.push([i, dist])
#     hits = _.chain(hits)
#       .sortBy((elt) -> return elt[1])
#       .map((elt) -> return elt[0])
#       .value()
#
#     result = hittest.create_hit_test_result()
#     result['1d'].indices = hits
#     return result
#
#   _hit_span: (geometry) ->
#       [vx, vy] = [geometry.vx, geometry.vy]
#       [xb, yb] = this.bounds()
#       result = hittest.create_hit_test_result()
#
#       if geometry.direction == 'h'
#         # use hexagon bounds instead of current pointer y coordinates
#         y0 = yb[0]
#         y1 = yb[1]
#         if @_diagonal? and @model.properties.diagonal.units == "data"
#           vx0 = vx - @max_diagonal
#           vx1 = vx + @max_diagonal
#           [x0, x1] = @renderer.xmapper.v_map_from_target([vx0, vx1])
#         else
#           ms = @max_size/2
#           vx0 = vx - ms
#           vx1 = vx + ms
#           [x0, x1] = @renderer.xmapper.v_map_from_target([vx0, vx1], true)
#       else
#         # use hexagon bounds instead of current pointer x coordinates
#         x0 = xb[0]
#         x1 = xb[1]
#         if @_diagonal? and @model.properties.diagonal.units == "data"
#           vy0 = vy - @max_diagonal
#           vy1 = vy + @max_diagonal
#           [y0, y1] = @renderer.ymapper.v_map_from_target([vy0, vy1])
#         else
#           ms = @max_size/2
#           vy0 = vy - ms
#           vy1 = vy + ms
#           [y0, y1] = @renderer.ymapper.v_map_from_target([vy0, vy1], true)
#
#       bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
#       hits = (xx.i for xx in @index.search(bbox))
#
#       result['1d'].indices = hits
#       return result
#
#   _hit_rect: (geometry) ->
#     [x0, x1] = @renderer.xmapper.v_map_from_target([geometry.vx0, geometry.vx1], true)
#     [y0, y1] = @renderer.ymapper.v_map_from_target([geometry.vy0, geometry.vy1], true)
#     bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
#     result = hittest.create_hit_test_result()
#     result['1d'].indices = (x.i for x in @index.search(bbox))
#     return result
#
#   _hit_poly: (geometry) ->
#     [vx, vy] = [_.clone(geometry.vx), _.clone(geometry.vy)]
#     sx = @renderer.plot_view.canvas.v_vx_to_sx(vx)
#     sy = @renderer.plot_view.canvas.v_vy_to_sy(vy)
#
#     # TODO (bev) use spatial index to pare candidate list
#     candidates = [0...@sx.length]
#
#     hits = []
#     for i in [0...candidates.length]
#       idx = candidates[i]
#       if hittest.point_in_poly(@sx[i], @sy[i], sx, sy)
#         hits.push(idx)
#
#     result = hittest.create_hit_test_result()
#     result['1d'].indices = hits
#     return result

#   # hexagon does not inherit from marker (since it also accepts diagonal) so we
#   # must supply a draw_legend for it  here
#   draw_legend: (ctx, x0, x1, y0, y1) ->
#     reference_point = @get_reference_point() ? 0
#
#     # using objects like this seems a little wonky, since the keys are coerced to
#     # stings, but it works
#     indices = [reference_point]
#     sx = { }
#     sx[reference_point] = (x0+x1)/2
#     sy = { }
#     sy[reference_point] = (y0+y1)/2
#     sdiagonal = { }
#     sdiagonal[reference_point] = Math.min(Math.abs(x1-x0), Math.abs(y1-y0))*0.4
#
#     data = {sx: sx, sy: sy, sdiagonal: sdiagonal}
#     @_render(ctx, indices, data)


class Hexagon extends Glyph.Model # XXX: Marker.Model
  default_view: HexagonView

  type: 'Hexagon'

  @coords [['x', 'y']]
  @mixins ['line', 'fill']
  @define {
      angle:              [ p.AngleSpec,    0                             ]
      size:               [ p.DistanceSpec, { units: "screen", value: 4 } ]
      diagonal:           [ p.DistanceSpec, null                          ]
      diagonal_dimension: [ p.String,       'x'                           ]
    }

  initialize: (attrs, options) ->
    super(attrs, options)
    @properties.diagonal.optional = true


module.exports =
  Model: Hexagon
  View: HexagonView
