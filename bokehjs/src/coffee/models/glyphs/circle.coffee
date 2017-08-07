import {XYGlyph, XYGlyphView} from "./xy_glyph"
import * as hittest from "core/hittest"
import * as p from "core/properties"

export class CircleView extends XYGlyphView

  _map_data: () ->
    # NOTE: Order is important here: size is always present (at least
    # a default), but radius is only present if a user specifies it
    if @_radius?
      if @model.properties.radius.spec.units == "data"
        rd = @model.properties.radius_dimension.spec.value
        @sradius = @sdist(@renderer["#{rd}scale"], @["_"+rd], @_radius)
      else
        @sradius = @_radius
        @max_size = 2 * @max_radius
    else
      @sradius = (s/2 for s in @_size)

  _mask_data: (all_indices) ->
    hr = @renderer.plot_view.frame.h_range
    vr = @renderer.plot_view.frame.v_range

    # check for radius first
    if @_radius? and @model.properties.radius.units == "data"
      sx0 = hr.start
      sx1 = hr.end
      [x0, x1] = @renderer.xscale.v_invert([sx0, sx1])
      x0 -= @max_radius
      x1 += @max_radius

      sy0 = vr.start
      sy1 = vr.end
      [y0, y1] = @renderer.yscale.v_invert([sy0, sy1])
      y0 -= @max_radius
      y1 += @max_radius

    else
      sx0 = hr.start - @max_size
      sx1 = hr.end + @max_size
      [x0, x1] = @renderer.xscale.v_invert([sx0, sx1])

      sy0 = vr.start - @max_size
      sy1 = vr.end + @max_size
      [y0, y1] = @renderer.yscale.v_invert([sy0, sy1])

    bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    return @index.indices(bbox)

  _render: (ctx, indices, {sx, sy, sradius}) ->

    for i in indices
      if isNaN(sx[i]+sy[i]+sradius[i])
        continue

      ctx.beginPath()
      ctx.arc(sx[i], sy[i], sradius[i], 0, 2*Math.PI, false)

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
    if @_radius? and @model.properties.radius.units == "data"
      x0 = x - @max_radius
      x1 = x + @max_radius

      y0 = y - @max_radius
      y1 = y + @max_radius

    else
      vx0 = vx - @max_size
      vx1 = vx + @max_size
      [x0, x1] = @renderer.xscale.v_invert([vx0, vx1])
      [x0, x1] = [Math.min(x0, x1), Math.max(x0, x1)]

      vy0 = vy - @max_size
      vy1 = vy + @max_size
      [y0, y1] = @renderer.yscale.v_invert([vy0, vy1])
      [y0, y1] = [Math.min(y0, y1), Math.max(y0, y1)]

    bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    candidates = @index.indices(bbox)

    hits = []
    if @_radius? and @model.properties.radius.units == "data"
      for i in candidates
        r2 = Math.pow(@sradius[i], 2)
        sx0 = @renderer.xscale.compute(x)
        sx1 = @renderer.xscale.compute(@_x[i])
        sy0 = @renderer.yscale.compute(y)
        sy1 = @renderer.yscale.compute(@_y[i])
        dist = Math.pow(sx0-sx1, 2) + Math.pow(sy0-sy1, 2)
        if dist <= r2
          hits.push([i, dist])
    else
      sx = @renderer.plot_view.canvas.vx_to_sx(vx)
      sy = @renderer.plot_view.canvas.vy_to_sy(vy)
      for i in candidates
        r2 = Math.pow(@sradius[i], 2)
        dist = Math.pow(@sx[i]-sx, 2) + Math.pow(@sy[i]-sy, 2)
        if dist <= r2
          hits.push([i, dist])

    return hittest.create_1d_hit_test_result(hits)

  _hit_span: (geometry) ->
      [vx, vy] = [geometry.vx, geometry.vy]
      {minX, minY, maxX, maxY} = this.bounds()
      result = hittest.create_hit_test_result()

      if geometry.direction == 'h'
        # use circle bounds instead of current pointer y coordinates
        y0 = minY
        y1 = maxY
        if @_radius? and @model.properties.radius.units == "data"
          vx0 = vx - @max_radius
          vx1 = vx + @max_radius
          [x0, x1] = @renderer.xscale.v_invert([vx0, vx1])
        else
          ms = @max_size/2
          vx0 = vx - ms
          vx1 = vx + ms
          [x0, x1] = @renderer.xscale.v_invert([vx0, vx1])
      else
        # use circle bounds instead of current pointer x coordinates
        x0 = minX
        x1 = maxX
        if @_radius? and @model.properties.radius.units == "data"
          vy0 = vy - @max_radius
          vy1 = vy + @max_radius
          [y0, y1] = @renderer.yscale.v_invert([vy0, vy1])
        else
          ms = @max_size/2
          vy0 = vy - ms
          vy1 = vy + ms
          [y0, y1] = @renderer.yscale.v_invert([vy0, vy1])

      bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
      hits = @index.indices(bbox)

      result['1d'].indices = hits
      return result

  _hit_rect: (geometry) ->
    [x0, x1] = @renderer.xscale.v_invert([geometry.vx0, geometry.vx1])
    [y0, y1] = @renderer.yscale.v_invert([geometry.vy0, geometry.vy1])
    bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    result = hittest.create_hit_test_result()
    result['1d'].indices = @index.indices(bbox)
    return result

  _hit_poly: (geometry) ->
    [vx, vy] = [geometry.vx, geometry.vy]
    sx = @renderer.plot_view.canvas.v_vx_to_sx(vx)
    sy = @renderer.plot_view.canvas.v_vy_to_sy(vy)

    # TODO (bev) use spatial index to pare candidate list
    candidates = [0...@sx.length]

    hits = []
    for i in [0...candidates.length]
      idx = candidates[i]
      if hittest.point_in_poly(@sx[i], @sy[i], sx, sy)
        hits.push(idx)

    result = hittest.create_hit_test_result()
    result['1d'].indices = hits
    return result

  # circle does not inherit from marker (since it also accepts radius) so we
  # must supply a draw_legend for it  here
  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    # using objects like this seems a little wonky, since the keys are coerced to
    # stings, but it works
    indices = [index]
    sx = { }
    sx[index] = (x0+x1)/2
    sy = { }
    sy[index] = (y0+y1)/2
    sradius = { }
    sradius[index] = Math.min(Math.abs(x1-x0), Math.abs(y1-y0))*0.2

    data = {sx: sx, sy: sy, sradius: sradius}
    @_render(ctx, indices, data)

export class Circle extends XYGlyph # XXX: Marker
  default_view: CircleView

  type: 'Circle'

  @mixins ['line', 'fill']
  @define {
      angle:            [ p.AngleSpec,    0                             ]
      size:             [ p.DistanceSpec, { units: "screen", value: 4 } ]
      radius:           [ p.DistanceSpec, null                          ]
      radius_dimension: [ p.String,       'x'                           ]
    }

  initialize: (attrs, options) ->
    super(attrs, options)
    @properties.radius.optional = true
