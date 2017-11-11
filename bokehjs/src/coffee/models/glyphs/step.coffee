import {XYGlyph, XYGlyphView} from "./xy_glyph"
import * as p from "core/properties"

export class StepView extends XYGlyphView

  _render: (ctx, indices, {sx, sy}) ->
    @visuals.line.set_value(ctx)

    L = indices.length
    if L < 2
      return

    ctx.beginPath()

    ctx.moveTo(sx[0], sy[0])

    for i in [1...L]

      switch @model.mode
        when "before"
          [x1, y1] = [sx[i-1], sy[i]]
          [x2, y2] = [sx[i],   sy[i]]
        when "after"
          [x1, y1] = [sx[i], sy[i-1]]
          [x2, y2] = [sx[i], sy[i]  ]
        when "center"
          xm = (sx[i-1] + sx[i])/2
          [x1, y1] = [xm, sy[i-1]]
          [x2, y2] = [xm, sy[i]  ]

      ctx.lineTo(x1, y1)
      ctx.lineTo(x2, y2)

    ctx.lineTo(sx[L-1], sy[L-1])

    ctx.stroke()

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    @_generic_line_legend(ctx, x0, x1, y0, y1, index)

export class Step extends XYGlyph
  default_view: StepView

  type: 'Step'

  @mixins ['line']
  @define {
    mode: [ p.StepMode, "before"]
  }
