import * as _ from "underscore"

import {Glyph, GlyphView} from "./glyph"
import * as p from "../../core/properties"

export class ArcView extends GlyphView

  _index_data: () ->
    @_xy_index()

  _map_data: () ->
    if @model.properties.radius.units == "data"
      @sradius = @sdist(@renderer.xmapper, @_x, @_radius)
    else
      @sradius = @_radius

  _render: (ctx, indices, {sx, sy, sradius, _start_angle, _end_angle}) ->
    if @visuals.line.doit
      direction = @model.properties.direction.value()
      for i in indices
        if isNaN(sx[i]+sy[i]+sradius[i]+_start_angle[i]+_end_angle[i])
          continue

        ctx.beginPath()
        ctx.arc(sx[i], sy[i], sradius[i], _start_angle[i], _end_angle[i], direction)

        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    @_generic_line_legend(ctx, x0, x1, y0, y1, index)

export class Arc extends Glyph
  default_view: ArcView

  type: 'Arc'

  @coords [['x', 'y']]
  @mixins ['line']
  @define {
      direction:   [ p.Direction,   'anticlock' ]
      radius:      [ p.DistanceSpec             ]
      start_angle: [ p.AngleSpec                ]
      end_angle:   [ p.AngleSpec                ]
    }
