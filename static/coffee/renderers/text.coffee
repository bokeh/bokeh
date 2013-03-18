
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

  _set_data: (@data) ->
    @x = @glyph_props.v_select('x', data)
    @y = @glyph_props.v_select('y', data)
    angles = (@glyph_props.select("angle", obj) for obj in data) # TODO deg/rad
    @angle = (-angle for angle in angles)
    @text = @glyph_props.v_select("text", data)

  _render: () ->
    [@sx, @sy] = @map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)

    ctx = @plot_view.ctx

    ctx.save()
    if @glyph_props.fast_path
      @_fast_path(ctx)
    else
      @_full_path(ctx)
    ctx.restore()

  _fast_path: (ctx) ->
    @glyph_props.text_properties.set(ctx, @glyph_props)
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

  _full_path: (ctx) ->
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i] + @angle[i])
        continue

      ctx.translate(@sx[i], @sy[i])
      ctx.rotate(@angle[i])

      @glyph_props.text_properties.set(ctx, @data[i])
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

