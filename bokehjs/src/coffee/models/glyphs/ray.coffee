import * as _ from "underscore"

import {Glyph, GlyphView} from "./glyph"
import * as p from "../../core/properties"

export class RayView extends GlyphView

  _index_data: () ->
    @_xy_index()

  _map_data: () ->
    @slength = @sdist(@renderer.xmapper, @_x, @_length)

  _render: (ctx, indices, {sx, sy, slength, _angle}) ->
    if @visuals.line.doit

      width = @renderer.plot_view.frame.width
      height = @renderer.plot_view.frame.height
      inf_len = 2 * (width + height)
      for i in [0...slength.length]
        if slength[i] == 0
          slength[i] = inf_len

      for i in indices
        if isNaN(sx[i]+sy[i]+_angle[i]+slength[i])
          continue

        ctx.translate(sx[i], sy[i])
        ctx.rotate(_angle[i])

        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(slength[i], 0)

        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

        ctx.rotate(-_angle[i])
        ctx.translate(-sx[i], -sy[i])

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    @_generic_line_legend(ctx, x0, x1, y0, y1, index)

export class Ray extends Glyph
  default_view: RayView

  type: 'Ray'

  @coords [['x', 'y']]
  @mixins ['line']
  @define {
      length: [ p.DistanceSpec ]
      angle:  [ p.AngleSpec    ]
    }
