define [
  "underscore",
  "./glyph",
], (_, Glyph) ->

  class TextView extends Glyph.View

    _fields: ['x', 'y', 'angle', 'text:string', 'x_offset', 'y_offset']
    _properties: ['text']

    _map_data: () ->
      [@sx, @sy] = @renderer.map_to_screen(@x, @glyph.x.units, @y, @glyph.y.units)

      @sx_offset = @distance_vector('x', 'x_offset', 'edge')
      @sy_offset = @distance_vector('y', 'y_offset', 'edge')

    _render: (ctx, indices) ->
      for i in indices
        if isNaN(@sx[i] + @sy[i] + @sx_offset[i] + @sy_offset[i] + @angle[i]) or not @text[i]?
          continue

        ctx.save()
        ctx.translate(@sx[i] + @sx_offset[i], @sy[i] + @sy_offset[i])
        ctx.rotate(@angle[i])

        @props.text.set_vectorize(ctx, i)
        ctx.fillText(@text[i], 0, 0)
        ctx.restore()

    draw_legend: (ctx, x1, x2, y1, y2) ->
      ctx.save()
      reference_point = @get_reference_point()
      if reference_point?
        glyph_settings = reference_point
      else
        glyph_settings = @props
      text_props = @props.text
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

    defaults: ->
      return _.extend {}, super(), {
        angle: 0
        x_offset: {value: 0, units: "screen"}
        y_offset: {value: 0, units: "screen"}
      }

    display_defaults: ->
      return _.extend {}, super(), {
        text_font: "helvetica"
        text_font_size: "12pt"
        text_font_style: "normal"
        text_color: "#444444"
        text_alpha: 1.0
        text_align: "left"
        text_baseline: "bottom"
      }

  class Texts extends Glyph.Collection
    model: Text

  return {
    Model: Text
    View: TextView
    Collection: new Texts()
  }
