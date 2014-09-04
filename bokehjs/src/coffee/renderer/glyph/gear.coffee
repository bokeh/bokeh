define [
  "underscore",
  "gear_utils",
  "renderer/properties",
  "util/bezier",
  "./glyph",
], (_, GearUtils, Properties, Bezier, Glyph) ->

  class GearView extends Glyph.View

    _fields: ['x', 'y', 'angle', 'module', 'teeth', 'pressure_angle', 'shaft_size', 'internal']
    _properties: ['line', 'fill']

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(
        @x, @glyph_props.x.units, @y, @glyph_props.y.units, @x_range_name, @y_range_name
      )
      @smodule = @distance_vector('x', 'module', 'edge')

    _render: (ctx, indices, glyph_props) ->
      for i in indices
        [sx, sy, angle, module, teeth, pressure_angle, shaft_size, internal] =
          [@sx[i], @sy[i], @angle[i], @smodule[i], @teeth[i], @pressure_angle[i], @shaft_size[i], @internal[i]]

        if isNaN(sx + sy + angle + module + teeth + pressure_angle + shaft_size + internal)
          continue

        pitch_radius = module*teeth/2

        if internal
          fn = GearUtils.create_internal_gear_tooth
        else
          fn = GearUtils.create_gear_tooth

        seq0 = fn(module, teeth, pressure_angle)

        [M, x, y] = seq0[0..2]
        seq = seq0[3..]

        ctx.save()
        ctx.translate(sx, sy)
        ctx.rotate(angle)

        ctx.beginPath()

        rot = 2*Math.PI/teeth
        ctx.moveTo(x, y)

        for j in [0...teeth]
          @_render_seq(ctx, seq)
          ctx.rotate(rot)

        ctx.closePath()

        if internal
          rim_radius = pitch_radius + 2.75*module
          ctx.moveTo(rim_radius, 0)
          ctx.arc(0, 0, rim_radius, 0, 2*Math.PI, true)
        else if shaft_size > 0
          shaft_radius = pitch_radius*shaft_size
          ctx.moveTo(shaft_radius, 0)
          ctx.arc(0, 0, shaft_radius, 0, 2*Math.PI, true)

        if glyph_props.fill_properties.do_fill
          glyph_props.fill_properties.set_vectorize(ctx, i)
          ctx.fill()

        if glyph_props.line_properties.do_stroke
          glyph_props.line_properties.set_vectorize(ctx, i)
          ctx.stroke()

        ctx.restore()

      return

    _render_seq: (ctx, seq) ->
      i = 0

      while i < seq.length
        if _.isString(seq[i])
            c = seq[i]
            i += 1

        switch c
          when "M"
            [x, y] = seq[i...i+2]
            ctx.moveTo(x, y)
            [px, py] = [x, y]
            i += 2
          when "L"
            [x, y] = seq[i...i+2]
            ctx.lineTo(x, y)
            [px, py] = [x, y]
            i += 2
          when "C"
            [cx0, cy0, cx1, cy1, x, y] = seq[i...i+6]
            ctx.bezierCurveTo(cx0, cy0, cx1, cy1, x, y)
            [px, py] = [x, y]
            i += 6
          when "Q"
            [cx0, cy0, x, y] = seq[i...i+4]
            ctx.quadraticCurveTo(cx0, cy0, x, y)
            [px, py] = [x, y]
            i += 4
          when "A"
            [rx, ry, x_rotation, large_arc, sweep, x, y] = seq[i...i+7]

            segments = Bezier.arc_to_bezier(px, py, rx, ry, -x_rotation, large_arc, 1 - sweep, x, y)

            for [cx0, cy0, cx1, cy1, x, y] in segments
              ctx.bezierCurveTo(cx0, cy0, cx1, cy1, x, y)

            [px, py] = [x, y]
            i += 7
          else
            throw new Error("unexpected command: #{c}")

      return

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_line_legend(ctx, x0, x1, y0, y1)

  class Gear extends Glyph.Model
    default_view: GearView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend({}, super(), {
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
    Model: Gear
    View: GearView
  }
