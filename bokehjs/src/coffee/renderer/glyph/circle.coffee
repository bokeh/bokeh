_ = require "underscore"
Glyph = require "./glyph"
hittest = require "../../common/hittest"

class CircleView extends Glyph.View

  _index_data: () ->
    return @_xy_index()

  _map_data: () ->
    # NOTE: Order is important here: size is always present (at least
    # a default), but radius is only present if a user specifies it
    if @radius?
      if @distances.radius.units == "data"
        rd = @fields.radius_dimension.fixed_value
        @sradius = @sdist(@renderer["#{rd}mapper"], @[rd], @radius)
      else
        @sradius = @radius
        @max_size = 2 * @max_radius
    else
      @sradius = (s/2 for s in @size)

  _mask_data: (all_indices) ->
    hr = @renderer.plot_view.frame.get('h_range')
    vr = @renderer.plot_view.frame.get('v_range')

    # check for radius first
    if @radius? and @distances.radius.units == "data"
      sx0 = hr.get('start')
      sx1 = hr.get('end')
      [x0, x1] = @renderer.xmapper.v_map_from_target([sx0, sx1], true)
      x0 -= @max_radius
      x1 += @max_radius

      sy0 = vr.get('start')
      sy1 = vr.get('end')
      [y0, y1] = @renderer.ymapper.v_map_from_target([sy0, sy1], true)
      y0 -= @max_radius
      y1 += @max_radius

    else
      sx0 = hr.get('start') - @max_size
      sx1 = hr.get('end') + @max_size
      [x0, x1] = @renderer.xmapper.v_map_from_target([sx0, sx1], true)

      sy0 = vr.get('start') - @max_size
      sy1 = vr.get('end') + @max_size
      [y0, y1] = @renderer.ymapper.v_map_from_target([sy0, sy1], true)

    # rbush expects x0, y0 to be min, x1, y1 max
    if x0 > x1 then [x0, x1] = [x1, x0]
    if y0 > y1 then [y0, y1] = [y1, y0]

    return (x[4].i for x in @index.search([x0, y0, x1, y1]))

  _render: (ctx, indices, {sx, sy, sradius}) ->

    for i in indices
      if isNaN(sx[i]+sy[i]+sradius[i])
        continue

      ctx.beginPath()
      ctx.arc(sx[i], sy[i], sradius[i], 0, 2*Math.PI, false)

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
    if @radius? and @distances.radius.units == "data"
      x0 = x - @max_radius
      x1 = x + @max_radius

      y0 = y - @max_radius
      y1 = y + @max_radius

    else
      vx0 = vx - @max_size
      vx1 = vx + @max_size
      [x0, x1] = @renderer.xmapper.v_map_from_target([vx0, vx1], true)
      [x0, x1] = [Math.min(x0, x1), Math.max(x0, x1)]

      vy0 = vy - @max_size
      vy1 = vy + @max_size
      [y0, y1] = @renderer.ymapper.v_map_from_target([vy0, vy1], true)
      [y0, y1] = [Math.min(y0, y1), Math.max(y0, y1)]

    candidates = (pt[4].i for pt in @index.search([x0, y0, x1, y1]))

    hits = []
    if @radius? and @distances.radius.units == "data"
      for i in candidates
        r2 = Math.pow(@sradius[i], 2)
        sx0 = @renderer.xmapper.map_to_target(x, true)
        sx1 = @renderer.xmapper.map_to_target(@x[i], true)
        sy0 = @renderer.ymapper.map_to_target(y, true)
        sy1 = @renderer.ymapper.map_to_target(@y[i], true)
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
    hits = _.chain(hits)
      .sortBy((elt) -> return elt[1])
      .map((elt) -> return elt[0])
      .value()

    result = hittest.create_hit_test_result()
    result['1d'].indices = hits
    return result

  _hit_span: (geometry) ->
      [vx, vy] = [geometry.vx, geometry.vy]
      [xb, yb] = this.bounds()
      result = hittest.create_hit_test_result()

      if geometry.direction == 'h'
        # use circle bounds instead of current pointer y coordinates
        y0 = yb[0]
        y1 = yb[1]
        if @radius? and @distances.radius.units == "data"
          vx0 = vx - @max_radius
          vx1 = vx + @max_radius
          [x0, x1] = @renderer.xmapper.v_map_from_target([vx0, vx1])
        else
          ms = @max_size/2
          vx0 = vx - ms
          vx1 = vx + ms
          [x0, x1] = @renderer.xmapper.v_map_from_target([vx0, vx1], true)
      else
        # use circle bounds instead of current pointer x coordinates
        x0 = xb[0]
        x1 = xb[1]
        if @radius? and @distances.radius.units == "data"
          vy0 = vy - @max_radius
          vy1 = vy + @max_radius
          [y0, y1] = @renderer.ymapper.v_map_from_target([vy0, vy1])
        else
          ms = @max_size/2
          vy0 = vy - ms
          vy1 = vy + ms
          [y0, y1] = @renderer.ymapper.v_map_from_target([vy0, vy1], true)

      hits = (xx[4].i for xx in @index.search([x0, y0, x1, y1]))

      result['1d'].indices = hits
      return result

  _hit_rect: (geometry) ->
    [x0, x1] = @renderer.xmapper.v_map_from_target([geometry.vx0, geometry.vx1], true)
    [y0, y1] = @renderer.ymapper.v_map_from_target([geometry.vy0, geometry.vy1], true)
    result = hittest.create_hit_test_result()
    result['1d'].indices = (x[4].i for x in @index.search([x0, y0, x1, y1]))
    return result

  _hit_poly: (geometry) ->
    [vx, vy] = [_.clone(geometry.vx), _.clone(geometry.vy)]
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
  draw_legend: (ctx, x0, x1, y0, y1) ->
    reference_point = @get_reference_point() ? 0

    # using objects like this seems a little wonky, since the keys are coerced to
    # stings, but it works
    indices = [reference_point]
    sx = { }
    sx[reference_point] = (x0+x1)/2
    sy = { }
    sy[reference_point] = (y0+y1)/2
    sradius = { }
    sradius[reference_point] = Math.min(Math.abs(x1-x0), Math.abs(y1-y0))*0.2

    data = {sx: sx, sy: sy, sradius: sradius}
    @_render(ctx, indices, data)

class Circle extends Glyph.Model
  default_view: CircleView
  type: 'Circle'
  distances: ['?radius', '?size']
  fields: ['radius_dimension:string']

  display_defaults: ->
    return _.extend {}, super(), {
      size: 4 # XXX: Circle should be a marker, then this wouldn't be necessary.
    }

  defaults: ->
    return _.extend {}, super(), {
      radius_dimension: 'x'
    }

module.exports =
  Model: Circle
  View: CircleView