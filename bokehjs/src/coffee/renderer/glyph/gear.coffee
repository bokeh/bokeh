_ = require "underscore"
Glyph = require "./glyph"
if global._bokehTest?
  GearUtils = undefined  # TODO Make work
else
  GearUtils = require "gear_utils"
Bezier = require "../../util/bezier"

class GearView extends Glyph.View

  _index_data: () ->
    return @_xy_index()

  _map_data: () ->
    @smodule = @sdist(@renderer.xmapper, @x, @module, 'edge')

  _render: (ctx, indices, {sx, sy, smodule, angle, teeth, pressure_angle, shaft_size, internal}) ->
    for i in indices

      if isNaN(sx[i]+sy[i]+angle[i]+smodule[i]+teeth[i]+pressure_angle[i]+shaft_size[i]+internal[i])
        continue

      pitch_radius = smodule[i]*teeth[i]/2

      if internal[i]
        fn = GearUtils.create_internal_gear_tooth
      else
        fn = GearUtils.create_gear_tooth

      seq0 = fn(smodule[i], teeth[i], pressure_angle[i])

      [M, x, y] = seq0[0..2]
      seq = seq0[3..]

      ctx.save()
      ctx.translate(sx[i], sy[i])
      ctx.rotate(angle[i])

      ctx.beginPath()

      rot = 2*Math.PI/teeth[i]
      ctx.moveTo(x, y)

      for j in [0...teeth[i]]
        @_render_seq(ctx, seq)
        ctx.rotate(rot)

      ctx.closePath()

      if internal[i]
        rim_radius = pitch_radius + 2.75*smodule[i]
        ctx.moveTo(rim_radius, 0)
        ctx.arc(0, 0, rim_radius, 0, 2*Math.PI, true)
      else if shaft_size[i] > 0
        shaft_radius = pitch_radius*shaft_size[i]
        ctx.moveTo(shaft_radius, 0)
        ctx.arc(0, 0, shaft_radius, 0, 2*Math.PI, true)

      if @visuals.fill.do_fill
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.do_stroke
        @visuals.line.set_vectorize(ctx, i)
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
    @_generic_area_legend(ctx, x0, x1, y0, y1)

class Gear extends Glyph.Model
  default_view: GearView
  type: 'Gear'
  angles: ['module']
  fields: ['angle', 'internal:bool', 'pressure_angle', 'shaft_size', 'teeth']

  defaults: ->
    return _.extend {}, super(), {
      angle: 0
      pressure_angle: 20   # TODO: units: deg
      shaft_size: 0.3
      internal: false
    }

module.exports =
  Model: Gear
  View: GearView