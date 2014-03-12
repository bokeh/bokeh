
define [
  "underscore",
  "rbush",
  "renderer/properties",
  "./glyph",
], (_, rbush, Properties, Glyph) ->

  class AnnulusView extends Glyph.View

    _fields: ['x', 'y', 'inner_radius', 'outer_radius']
    _properties: ['line', 'fill']

    _set_data: () ->
      @max_radius = _.max(@outer_radius)
      @index = rbush()
      @index.load(
        ([@x[i], @y[i], @x[i], @y[i], {'i': i}] for i in [0...@x.length])
      )

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      @inner_radius = @distance_vector('x', 'inner_radius', 'edge')
      @outer_radius = @distance_vector('x', 'outer_radius', 'edge')

    _render: (ctx, indices, glyph_props, sx=@sx, sy=@sy, inner_radius=@inner_radius, outer_radius=@outer_radius) ->
      for i in indices

        if isNaN(sx[i] + sy[i] + inner_radius[i] + outer_radius[i])
          continue

        ctx.beginPath()
        ctx.arc(sx[i], sy[i], inner_radius[i], 0, 2*Math.PI*2, false)
        ctx.moveTo(sx[i]+outer_radius[i], sy[i])
        ctx.arc(sx[i], sy[i], outer_radius[i], 0, 2*Math.PI*2, true)

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

      if @outer_radius_units == "screen"
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
      if @outer_radius_units == "screen"
        sx = @plot_view.view_state.vx_to_sx(vx)
        sy = @plot_view.view_state.vy_to_sy(vy)
        for i in candidates
          r2 = Math.pow(@outer_radius[i], 2)
          dist = Math.pow(@sx[i]-sx, 2) + Math.pow(@sy[i]-sy, 2)
          if dist <= r2
            candidates2.push([i, dist])
      else
        for i in candidates
          r2 = Math.pow(@outer_radius[i], 2)
          sx0 = @plot_view.xmapper.map_to_target(x)
          sx1 = @plot_view.xmapper.map_to_target(@x[i])
          sy0 = @plot_view.ymapper.map_to_target(y)
          sy1 = @plot_view.ymapper.map_to_target(@y[i])
          dist = Math.pow(sx0-sx1, 2) + Math.pow(sy0-sy1, 2)
          if dist <= r2
            candidates2.push([i, dist])

      hits = []
      if @inner_radius_units == "screen"
        sx = @plot_view.view_state.vx_to_sx(vx)
        sy = @plot_view.view_state.vy_to_sy(vy)
        for [i, dist] in candidates2
          r2 = Math.pow(@inner_radius[i], 2)
          if dist >= r2
            hits.push([i, dist])
      else
        for [i, dist] in candidates2
          r2 = Math.pow(@inner_radius[i], 2)
          sx0 = @plot_view.xmapper.map_to_target(x)
          sx1 = @plot_view.xmapper.map_to_target(@x[i])
          sy0 = @plot_view.ymapper.map_to_target(y)
          sy1 = @plot_view.ymapper.map_to_target(@y[i])
          if dist >= r2
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
      inner_radius[reference_point] = r*0.4
      outer_radius = { }
      outer_radius[reference_point] = r*0.8

      @_render(ctx, indices, @glyph_props, sx, sy, inner_radius, outer_radius)

  class Annulus extends Glyph.Model
    default_view: AnnulusView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
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
    "Model": Annulus,
    "View": AnnulusView,
  }

