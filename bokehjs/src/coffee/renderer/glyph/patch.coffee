
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  glyph_properties = Properties.glyph_properties
  line_properties  = Properties.line_properties
  fill_properties  = Properties.fill_properties

  class PatchView extends Glyph.View

    initialize: (options) ->
      glyphspec = @mget('glyphspec')
      @glyph_props = new glyph_properties(
        @,
        glyphspec,
        ['x:number', 'y:number']
        {
          fill_properties: new fill_properties(@, glyphspec),
          line_properties: new line_properties(@, glyphspec)
        }
      )

      @do_fill = @glyph_props.fill_properties.do_fill
      @do_stroke = @glyph_props.line_properties.do_stroke
      super(options)

    _set_data: (@data) ->
      @x = @glyph_props.v_select('x', data)
      @y = @glyph_props.v_select('y', data)

    _render: () ->
      ctx = @plot_view.ctx

      ctx.save()

      [sx, sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      if @do_fill
        @glyph_props.fill_properties.set(ctx, @glyph_props)
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
        @glyph_props.line_properties.set(ctx, @glyph_props)
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

  class Patch extends Glyph.Model
    default_view: PatchView
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
    "Model": Patch,
    "View": PatchView,
  }
