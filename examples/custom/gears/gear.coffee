import * as p from "core/properties"
import {isString} from "core/util/types"
import {XYGlyph, XYGlyphView} from "models/glyphs/xy_glyph"

import {arc_to_bezier} from "./bezier"
import * as gear_utils from "./gear_utils"

export class GearView extends XYGlyphView

  _map_data: () ->
    @smodule = @sdist(@renderer.xscale, @_x, @_module, 'edge')

  _render: (ctx, indices, {sx, sy, smodule, _angle, _teeth, _pressure_angle, _shaft_size, _internal}) ->
    for i in indices

      if isNaN(sx[i]+sy[i]+_angle[i]+smodule[i]+_teeth[i]+_pressure_angle[i]+_shaft_size[i]+_internal[i])
        continue

      pitch_radius = smodule[i]*_teeth[i]/2

      if _internal[i]
        fn = gear_utils.create_internal_gear_tooth
      else
        fn = gear_utils.create_gear_tooth

      seq0 = fn(smodule[i], _teeth[i], _pressure_angle[i])

      [M, x, y] = seq0[0..2]
      seq = seq0[3..]

      ctx.save()
      ctx.translate(sx[i], sy[i])
      ctx.rotate(_angle[i])

      ctx.beginPath()

      rot = 2*Math.PI/_teeth[i]
      ctx.moveTo(x, y)

      for j in [0..._teeth[i]]
        @_render_seq(ctx, seq)
        ctx.rotate(rot)

      ctx.closePath()

      if _internal[i]
        rim_radius = pitch_radius + 2.75*smodule[i]
        ctx.moveTo(rim_radius, 0)
        ctx.arc(0, 0, rim_radius, 0, 2*Math.PI, true)
      else if _shaft_size[i] > 0
        shaft_radius = pitch_radius*_shaft_size[i]
        ctx.moveTo(shaft_radius, 0)
        ctx.arc(0, 0, shaft_radius, 0, 2*Math.PI, true)

      if @visuals.fill.doit
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.doit
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

      ctx.restore()

    return

  _render_seq: (ctx, seq) ->
    i = 0

    while i < seq.length
      if isString(seq[i])
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

          segments = arc_to_bezier(px, py, rx, ry, -x_rotation, large_arc, 1 - sweep, x, y)

          for [cx0, cy0, cx1, cy1, x, y] in segments
            ctx.bezierCurveTo(cx0, cy0, cx1, cy1, x, y)

          [px, py] = [x, y]
          i += 7
        else
          throw new Error("unexpected command: #{c}")

    return

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    @_generic_area_legend(ctx, x0, x1, y0, y1, index)

export class Gear extends XYGlyph
  type: 'Gear'
  default_view: GearView

  @mixins ['line', 'fill']
  @define {
    angle:          [ p.AngleSpec,  0     ]
    module:         [ p.NumberSpec, null  ]
    pressure_angle: [ p.NumberSpec, 20    ] # TODO: units: deg
    shaft_size:     [ p.NumberSpec, 0.3   ]
    teeth:          [ p.NumberSpec, null  ]
    internal:       [ p.NumberSpec, false ] # TODO (bev) bool
  }
