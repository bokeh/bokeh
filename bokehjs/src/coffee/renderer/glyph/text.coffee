_ = require "underscore"
Glyph = require "./glyph"

class TextView extends Glyph.View

  _index_data: () ->
    @_xy_index()

  _render: (ctx, indices, {sx, sy, x_offset, y_offset, angle, text}) ->
    for i in indices
      if (isNaN(sx[i]+sy[i]+x_offset[i]+y_offset[i]+angle[i]) or not text[i]?)
        continue

      ctx.save()
      ctx.translate(sx[i]+x_offset[i], sy[i]+y_offset[i])
      ctx.rotate(angle[i])

      @visuals.text.set_vectorize(ctx, i)
      ctx.fillText(text[i], 0, 0)
      ctx.restore()

  draw_legend: (ctx, x1, x2, y1, y2) ->
    ctx.save()
    reference_point = @get_reference_point()
    if reference_point?
      glyph_settings = reference_point
    else
      glyph_settings = @props
    text_props = @visuals.text
    text_props.set(ctx, glyph_settings)
    # override some features so we fit inside the legend
    ctx.font = text_props.font(12)
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    ctx.fillText("txt", x2, (y1+y2)/2)
    ctx.restore()

class Text extends Glyph.Model
  default_view: TextView
  type: 'Text'
  visuals: ['text']
  distances: ['x_offset', 'y_offset']
  angles: ['angle']
  fields: ['text:string']

  defaults: ->
    return _.extend {}, super(), {
      angle: 0
      x_offset: 0
      y_offset: 0
    }

module.exports =
  Model: Text
  View: TextView