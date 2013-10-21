
properties = require('../properties')
glyph_properties = properties.glyph_properties
line_properties = properties.line_properties
fill_properties = properties.fill_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class PatchesView extends GlyphView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['xs:array', 'ys:array']
      [
        new fill_properties(@, glyphspec),
        new line_properties(@, glyphspec)
      ]
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


class Patches extends Glyph
  default_view: PatchesView
  type: 'GlyphRenderer'


Patches::display_defaults = _.clone(Patches::display_defaults)
_.extend(Patches::display_defaults, {

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


exports.Patches = Patches
exports.PatchesView = PatchesView

