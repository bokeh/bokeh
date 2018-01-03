import {XYGlyph, XYGlyphView} from "./xy_glyph"
import * as p from "core/properties"
import {get_text_height} from "core/util/text"

export class TextView extends XYGlyphView

  _render: (ctx, indices, {sx, sy, _x_offset, _y_offset, _angle, _text}) ->
    for i in indices
      if (isNaN(sx[i]+sy[i]+_x_offset[i]+_y_offset[i]+_angle[i]) or not _text[i]?)
        continue

      if @visuals.text.doit
        text = "#{_text[i]}"

        ctx.save()
        ctx.translate(sx[i] + _x_offset[i], sy[i] + _y_offset[i])
        ctx.rotate(_angle[i])
        @visuals.text.set_vectorize(ctx, i)

        if text.indexOf("\n") == -1
          ctx.fillText(text, 0, 0)
        else
          lines = text.split("\n")

          font = @visuals.text.cache_select("font", i)
          {height} = get_text_height(font)
          line_height = @visuals.text.text_line_height.value()*height
          block_height = line_height*lines.length

          baseline = @visuals.text.cache_select("text_baseline", i)
          switch baseline
            when "top"
              y = 0
            when "middle"
              y = -block_height/2 + line_height/2
            when "bottom"
              y = -block_height + line_height
            else
              y = 0
              console.warn("'#{baseline}' baseline not supported with multi line text")

          for line in lines
            ctx.fillText(line, 0, y)
            y += line_height

        ctx.restore()

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    return null

export class Text extends XYGlyph
  default_view: TextView
  type: 'Text'

  @mixins ['text']
  @define {
    text:     [ p.StringSpec, {field: "text"} ]
    angle:    [ p.AngleSpec,  0               ]
    x_offset: [ p.NumberSpec, 0               ]
    y_offset: [ p.NumberSpec, 0               ]
  }
