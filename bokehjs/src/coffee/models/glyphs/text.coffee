import {XYGlyph, XYGlyphView} from "./xy_glyph"
import * as p from "../../core/properties"

export class TextView extends XYGlyphView

  _render: (ctx, indices, {sx, sy, _x_offset, _y_offset, _angle, _text}) ->
    for i in indices
      if (isNaN(sx[i]+sy[i]+_x_offset[i]+_y_offset[i]+_angle[i]) or not _text[i]?)
        continue

      if @visuals.text.doit
        ctx.save()
        ctx.translate(sx[i]+_x_offset[i], sy[i]+_y_offset[i])
        ctx.rotate(_angle[i])

        @visuals.text.set_vectorize(ctx, i)
        ctx.fillText(_text[i], 0, 0)
        ctx.restore()

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    ctx.save()
    @text_props.set_value(ctx)
    # override some features so we fit inside the legend
    ctx.font = @text_props.font_value()
    ctx.font = ctx.font.replace(/\b[\d\.]+[\w]+\b/, '10pt')
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    ctx.fillText("text", x2, (y1+y2)/2)
    ctx.restore()

export class Text extends XYGlyph
  default_view: TextView

  type: 'Text'

  @mixins ['text']
  @define {
      text:     [ p.StringSpec, { field :"text" } ]
      angle:    [ p.AngleSpec,  0                 ]
      x_offset: [ p.NumberSpec, 0                 ]
      y_offset: [ p.NumberSpec, 0                 ]
    }
