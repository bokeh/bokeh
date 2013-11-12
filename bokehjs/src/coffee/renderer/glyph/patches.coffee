
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  glyph_properties = Properties.glyph_properties
  line_properties  = Properties.line_properties
  fill_properties  = Properties.fill_properties

  class PatchesView extends Glyph.View

    initialize: (options) ->
      glyphspec = @mget('glyphspec')
      @glyph_props = new glyph_properties(
        @,
        glyphspec,
        ['xs:array', 'ys:array']
        {
          fill_properties: new fill_properties(@, glyphspec),
          line_properties: new line_properties(@, glyphspec)
        }
      )

      @do_fill = @glyph_props.fill_properties.do_fill
      @do_stroke = @glyph_props.line_properties.do_stroke
      super(options)


    _set_data: (@data) ->
      # TODO store screen coords

    _render: () ->
      ctx = @plot_view.ctx

      ctx.save()
      for pt in @data
        x = @glyph_props.select('xs', pt)
        y = @glyph_props.select('ys', pt)
        [sx, sy] = @plot_view.map_to_screen(x, @glyph_props.xs.units, y, @glyph_props.ys.units)
        if @do_fill
          @glyph_props.fill_properties.set(ctx, pt)
          for i in [0..sx.length-1]
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

        if @do_stroke
          @glyph_props.line_properties.set(ctx, pt)
          for i in [0..sx.length-1]
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

      ctx.restore()

  class Patches extends Glyph.Model
    default_view: PatchesView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        fill_color: 'gray'
        fill_alpha: 1.0
        line_color: 'red'
        line_width: 1
        line_alpha: 1.0
        line_join: 'miter'
        line_cap: 'butt'
        line_dash: []
        line_dash_offset: 0
      })

  return {
    "Model": Patches,
    "View": PatchesView,
  }
