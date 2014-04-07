
define [
  "underscore",
  "rbush",
  "common/mathutils"
  "renderer/properties",
  "./glyph",
], (_, rbush, mathutils, Properties, Glyph) ->

  class WedgeView extends Glyph.View

    _fields: ['x', 'y', 'radius', 'start_angle', 'end_angle', 'direction:string']
    _properties: ['line', 'fill']

    _set_data: () ->
      @max_radius = _.max(@radius)
      @index = rbush()
      @index.load(
        ([@x[i], @y[i], @x[i], @y[i], {'i': i}] for i in [0...@x.length])
      )

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      @radius = @distance_vector('x', 'radius', 'edge')

    _render: (ctx, indices, glyph_props, sx=@sx, sy=@sy, radius=@radius) ->
      for i in indices

        if isNaN(sx[i] + sy[i] + radius[i] + @start_angle[i] + @end_angle[i] + @direction[i])
          continue

        ctx.beginPath()
        ctx.arc(sx[i], sy[i], radius[i], @start_angle[i], @end_angle[i], @direction[i])
        ctx.lineTo(sx[i], sy[i])
        ctx.closePath()

        if glyph_props.fill_properties.do_fill
          glyph_props.fill_properties.set_vectorize(ctx, i)
          ctx.fill()

        if glyph_props.line_properties.do_stroke
          glyph_props.line_properties.set_vectorize(ctx, i)
          ctx.stroke()

    _hit_point: (geometry) ->
      [vx, vy] = [geometry.vx, geometry.vy]
      x = @plot_view.xmapper.map_from_target(vx)
      y = @plot_view.ymapper.map_from_target(vy)

      if @radius_units == "screen"
        vx0 = vx - @max_radius
        vx1 = vx + @max_radius
        [x0, x1] = @plot_view.xmapper.v_map_from_target([vx0, vx1])

        vy0 = vy - @max_radius
        vy1 = vy + @max_radius
        [y0, y1] = @plot_view.ymapper.v_map_from_target([vy0, vy1])

      else
        x0 = x - @max_radius
        x1 = x + @max_radius

        y0 = y - @max_radius
        y1 = y + @max_radius

      candidates = (pt[4].i for pt in @index.search([x0, y0, x1, y1]))

      candidates2 = []
      if @radius_units == "screen"
        sx = @plot_view.view_state.vx_to_sx(vx)
        sy = @plot_view.view_state.vy_to_sy(vy)
        for i in candidates
          r2 = Math.pow(@radius[i], 2)
          dist = Math.pow(@sx[i]-sx, 2) + Math.pow(@sy[i]-sy, 2)
          if dist <= r2
            candidates2.push([i, dist])
      else
        for i in candidates
          r2 = Math.pow(@radius[i], 2)
          sx0 = @plot_view.xmapper.map_to_target(x)
          sx1 = @plot_view.xmapper.map_to_target(@x[i])
          sy0 = @plot_view.ymapper.map_to_target(y)
          sy1 = @plot_view.ymapper.map_to_target(@y[i])
          dist = Math.pow(sx0-sx1, 2) + Math.pow(sy0-sy1, 2)
          if dist <= r2
            candidates2.push([i, dist])

      hits = []
      for [i, dist] in candidates2
        sx = @plot_view.view_state.vx_to_sx(vx)
        sy = @plot_view.view_state.vy_to_sy(vy)
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

      radius = { }
      radius[reference_point] = Math.min(Math.abs(x1-x0), Math.abs(y1-y0)) * 0.4

      @_render(ctx, indices, @glyph_props, sx, sy, radius)

  class Wedge extends Glyph.Model
    default_view: WedgeView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        direction: 'anticlock'
        fill_color: 'gray'
        fill_alpha: 1.0
        line_color: 'red'
        line_width: 1
        line_alpha: 1.0
        line_join: 'miter'
        line_cap: 'butt'
        line_dash: []
        line_dash_offset: 0
      })

  return {
    "Model": Wedge,
    "View": WedgeView,
  }

