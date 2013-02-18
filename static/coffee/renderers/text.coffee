
properties = require('./properties')
glyph_properties = properties.glyph_properties
text_properties = properties.text_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class TextView extends GlyphView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['x', 'y', 'angle', 'text:string'],
      [
        new text_properties(@, glyphspec)
      ]
    )

    super(options)

  _render: (data) ->
    ctx = @plot_view.ctx
    glyph_props = @glyph_props

    ctx.save()

    x = (glyph_props.select("x", obj) for obj in data)
    y = (glyph_props.select("y", obj) for obj in data)
    [@sx, @sy] = @map_to_screen(x, glyph_props.x.units, y, glyph_props.y.units)
    @angle = (glyph_props.select("angle", obj) for obj in data) # TODO deg/rad
    @text = (glyph_props.select("text", obj) for obj in data)

    if @glyph_props.fast_path
      @_fast_path(ctx, glyph_props)
    else
      @_full_path(ctx, glyph_props, data)

    ctx.restore()

  _fast_path: (ctx, glyph_props) ->
    glyph_props.text_properties.set(ctx, glyph)
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i] + @angle[i])
        continue

      if angle[i]
        ctx.translate(@sx[i], @sy[i])
        ctx.rotate(@angle[i])
        ctx.fillText(@text[i], 0, 0)
        ctx.rotate(-@angle[i])
        ctx.translate(-@sx[i], -@sy[i])
      else
        ctx.fillText(text[i], @sx[i], @sy[i])

  _full_path: (ctx, glyph_props, data) ->
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i] + @angle[i])
        continue

      ctx.translate(@sx[i], @sy[i])
      ctx.rotate(@angle[i])

      glyph_props.text_properties.set(ctx, data[i])
      ctx.fillText(@text[i], 0, 0)

      ctx.rotate(-@angle[i])
      ctx.translate(-@sx[i], -@sy[i])


class Text extends Glyph
  default_view: TextView
  type: 'GlyphRenderer'


Text::display_defaults = _.clone(Text::display_defaults)
_.extend(Text::display_defaults, {

  text_font: "helvetica"
  text_font_size: "1em"
  text_font_style: "normal"
  text_color: "#444444"
  text_alpha: 1.0
  text_align: "left"
  text_baseline: "bottom"

})

class Texts extends Backbone.Collection
  model: Text

exports.texts = new Texts
exports.Text = Text
exports.TextView = TextView

