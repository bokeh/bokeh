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

  _mask_data: () ->
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

  _render: (ctx, indices, sx=@sx, sy=@sy, sradius=@sradius) ->
    for i in indices
      if isNaN(sx[i] + sy[i] + sradius[i])
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

      vy0 = vy - @max_size
      vy1 = vy + @max_size
      [y0, y1] = @renderer.ymapper.v_map_from_target([vy0, vy1], true)

    candidates = (pt[4].i for pt in @index.search([x0, y0, x1, y1]))

    hits = []
    if @size
      sx = @renderer.plot_view.canvas.vx_to_sx(vx)
      sy = @renderer.plot_view.canvas.vy_to_sy(vy)
      for i in candidates
        r2 = Math.pow(@sradius[i], 2)
        dist = Math.pow(@sx[i]-sx, 2) + Math.pow(@sy[i]-sy, 2)
        if dist <= r2
          hits.push([i, dist])
    else
      for i in candidates
        r2 = Math.pow(@sradius[i], 2)
        sx0 = @renderer.xmapper.map_to_target(x, true)
        sx1 = @renderer.xmapper.map_to_target(@x[i], true)
        sy0 = @renderer.ymapper.map_to_target(y, true)
        sy1 = @renderer.ymapper.map_to_target(@y[i], true)
        dist = Math.pow(sx0-sx1, 2) + Math.pow(sy0-sy1, 2)
        if dist <= r2
          hits.push([i, dist])
    hits = _.chain(hits)
      .sortBy((elt) -> return elt[1])
      .map((elt) -> return elt[0])
      .value()
    return hits

  _hit_rect: (geometry) ->
    [x0, x1] = @renderer.xmapper.v_map_from_target([geometry.vx0, geometry.vx1], true)
    [y0, y1] = @renderer.ymapper.v_map_from_target([geometry.vy0, geometry.vy1], true)

    return (x[4].i for x in @index.search([x0, y0, x1, y1]))

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
    return hits

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

    @_render(ctx, indices, sx, sy, sradius)

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

class Circles extends Glyph.Collection
  model: Circle

module.exports =
  Model: Circle
  View: CircleView
  Collection: new Circles()
