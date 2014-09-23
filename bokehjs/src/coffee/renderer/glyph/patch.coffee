define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class PatchView extends Glyph.View

    _fields: ['x', 'y']
    _properties: ['line', 'fill']

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(
        @x, @glyph_props.x.units, @y, @glyph_props.y.units, @x_range_name, @y_range_name
      )

    _render: (ctx, indices, glyph_props) ->

      if glyph_props.fill_properties.do_fill
        glyph_props.fill_properties.set(ctx, glyph_props)
        for i in indices
          if i == 0
            ctx.beginPath()
            ctx.moveTo(@sx[i], @sy[i])
            continue
          else if isNaN(@sx[i] + @sy[i])
            ctx.closePath()
            ctx.fill()
            ctx.beginPath()
            continue
          else
            ctx.lineTo(@sx[i], @sy[i])
        ctx.closePath()
        ctx.fill()

      if glyph_props.line_properties.do_stroke
        glyph_props.line_properties.set(ctx, glyph_props)
        for i in indices
          if i == 0
            ctx.beginPath()
            ctx.moveTo(@sx[i], @sy[i])
            continue
          else if isNaN(@sx[i] + @sy[i])
            ctx.closePath()
            ctx.stroke()
            ctx.beginPath()
            continue
          else
            ctx.lineTo(@sx[i], @sy[i])
        ctx.closePath()
        ctx.stroke()

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_area_legend(ctx, x0, x1, y0, y1)

  class Patch extends Glyph.Model
    default_view: PatchView
    type: 'Patch'

    display_defaults: ->
      return _.extend {}, super(), @line_defaults, @fill_defaults

  class Patches extends Glyph.Collection
    model: Patch

  return {
    Model: Patch
    View: PatchView
    Collection: new Patches()
  }
