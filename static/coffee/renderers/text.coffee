
glyph = require("../glyph")
Glyph = glyph.Glyph
text_properties = glyph.text_properties

glyph_renderer = require("../glyph_renderers")
GlyphRenderer = glyph_renderer.GlyphRenderer
GlyphRendererView = glyph_renderer.GlyphRendererView


class TextRendererView extends GlyphRendererView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph = new Glyph(
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
    glyph = @glyph

    ctx.save()

    x = (glyph.select("x", obj) for obj in data)
    y = (glyph.select("y", obj) for obj in data)
    [@sx, @sy] = @map_to_screen(x, glyph.x.units, y, glyph.y.units)
    @angle = (glyph.select("angle", obj) for obj in data) # TODO deg/rad
    @text = (glyph.select("text", obj) for obj in data)

    if @glyph.fast_path
      @_fast_path(ctx, glyph)
    else
      @_full_path(ctx, glyph, data)

    ctx.restore()

  _fast_path: (ctx, glyph) ->
    glyph.text_properties.set(ctx, glyph)
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

  _full_path: (ctx, glyph, data) ->
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i] + @angle[i])
        continue

      ctx.translate(@sx[i], @sy[i])
      ctx.rotate(@angle[i])

      glyph.text_properties.set(ctx, data[i])
      ctx.fillText(@text[i], 0, 0)

      ctx.rotate(-@angle[i])
      ctx.translate(-@sx[i], -@sy[i])


class TextRenderer extends GlyphRenderer
  default_view: TextRendererView
  type: 'TextRenderer'


TextRenderer::display_defaults = _.clone(TextRenderer::display_defaults)
_.extend(TextRenderer::display_defaults, {

  text_font: "helvetica"
  text_font_size: "1em"
  text_font_style: "normal"
  text_color: "#444444"
  text_alpha: 1.0
  text_align: "left"
  text_baseline: "bottom"

})

class TextRenderers extends Backbone.Collection
  model: TextRenderer

exports.textrenderers = new TextRenderers
exports.TextRenderer = TextRenderer
exports.TextRendererView = TextRendererView

