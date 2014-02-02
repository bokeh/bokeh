
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class TextView extends Glyph.View

    _fields: ['x', 'y', 'angle', 'text:string']
    _properties: ['text']

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)

    _render: (ctx, indices, glyph_props) ->
      for i in indices

        if isNaN(@sx[i] + @sy[i] + @angle[i])
          continue

        ctx.translate(@sx[i], @sy[i])
        ctx.rotate(@angle[i])

        glyph_props.text_properties.set_vectorize(ctx, i)
        ctx.fillText(@text[i], 0, 0)

        ctx.rotate(-@angle[i])
        ctx.translate(-@sx[i], -@sy[i])

    draw_legend: (ctx, x1, x2, y1, y2) ->
      glyph_props = @glyph_props
      text_props = glyph_props.text_properties
      ctx.save()
      reference_point = @get_reference_point()
      if reference_point?
        glyph_settings = reference_point
      else
        glyph_settings = glyph_props
      text_props.set(ctx, glyph_settings)
      #override some features so we fit inside the legend
      ctx.font = text_props.font(12)
      ctx.textAlign = "right"
      ctx.textBaseline = "middle"
      ctx.fillText("txt", x2, (y1+y2)/2)

      ctx.restore()

  class Text extends Glyph.Model
    default_view: TextView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        text_font: "helvetica"
        text_font_size: "12pt"
        text_font_style: "normal"
        text_color: "#444444"
        text_alpha: 1.0
        text_align: "left"
        text_baseline: "bottom"
      })

  return {
    "Model": Text,
    "View": TextView,
  }
