import {XYGlyph, XYGlyphView} from "./xy_glyph"

export class PatchView extends XYGlyphView

  _render: (ctx, indices, {sx, sy}) ->
    if @visuals.fill.doit
      @visuals.fill.set_value(ctx)

      for i in indices
        if i == 0
          ctx.beginPath()
          ctx.moveTo(sx[i], sy[i])
          continue
        else if isNaN(sx[i] + sy[i])
          ctx.closePath()
          ctx.fill()
          ctx.beginPath()
          continue
        else
          ctx.lineTo(sx[i], sy[i])

      ctx.closePath()
      ctx.fill()

    if @visuals.line.doit
      @visuals.line.set_value(ctx)

      for i in indices
        if i == 0
          ctx.beginPath()
          ctx.moveTo(sx[i], sy[i])
          continue
        else if isNaN(sx[i] + sy[i])
          ctx.closePath()
          ctx.stroke()
          ctx.beginPath()
          continue
        else
          ctx.lineTo(sx[i], sy[i])

      ctx.closePath()
      ctx.stroke()

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    @_generic_area_legend(ctx, x0, x1, y0, y1, index)

export class Patch extends XYGlyph
  default_view: PatchView

  type: 'Patch'

  @mixins ['line', 'fill']
