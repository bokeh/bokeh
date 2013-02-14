
glyph = require('../glyph')
Glyph = glyph.Glyph
line_properties = glyph.line_properties
fill_properties = glyph.fill_properties

glyph_renderer = require('../glyph_renderers')
GlyphRenderer = glyph_renderer.GlyphRenderer
GlyphRendererView = glyph_renderer.GlyphRendererView


class QuadRendererView extends GlyphRendererView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph = new Glyph(
      @,
      glyphspec,
      ['right', 'left', 'bottom', 'top'],
      [
        new fill_properties(@, glyphspec),
        new line_properties(@, glyphspec)
      ]
    )

    @do_fill   = true #@glyph.fill_properties.do_fill
    @do_stroke = true #@glyph.line_properties.do_stroke
    super(options)

  _render: (data) ->
    ctx = @plot_view.ctx
    glyph = @glyph

    ctx.save()

    left = (glyph.select('left', obj) for obj in data)
    top  = (glyph.select('top', obj) for obj in data)
    [@sx0, @sy0] = @map_to_screen(left, glyph.left.units, top, glyph.top.units)

    right  = (glyph.select('right', obj) for obj in data)
    bottom = (glyph.select('bottom', obj) for obj in data)
    [@sx1, @sy1] = @map_to_screen(right, glyph.right.units, bottom, glyph.bottom.units)

    if @glyph.fast_path
      @_fast_path(ctx, glyph)
    else
      @_full_path(ctx, glyph, data)

    ctx.restore()

  _fast_path: (ctx, glyph) ->
    if @do_fill
      glyph.fill_properties.set(ctx, glyph)
      ctx.beginPath()
      for i in [0..@sx0.length-1]
        if isNaN(@sx0[i] + @sy0[i] + @sx1[i] + @sy1[i])
          continue
        ctx.rect(@sx0[i], @sy0[i], @sx1[i]-@sx0[i], @sy1[i]-@sy0[i])
      ctx.fill()

    if @do_stroke
      glyph.line_properties.set(ctx, glyph)
      ctx.beginPath()
      for i in [0..@sx0.length-1]
        if isNaN(@sx0[i] + @sy0[i] + @sx1[i] + @sy1[i])
          continue
        ctx.rect(@sx0[i], @sy0[i], @sx1[i]-@sx0[i], @sy1[i]-@sy0[i])
      ctx.stroke()

  _full_path: (ctx, glyph, data) ->
    for i in [0..@sx0.length-1]
      if isNaN(@sx0[i] + @sy0[i] + @sx1[i] + @sy1[i])
        continue

      ctx.beginPath()
      ctx.rect(@sx0[i], @sy0[i], @sx1[i]-@sx0[i], @sy1[i]-@sy0[i])

      if @do_fill
        glyph.fill_properties.set(ctx, data[i])
        ctx.fill()

      if @do_stroke
        glyph.line_properties.set(ctx, data[i])
        ctx.stroke()


class QuadRenderer extends GlyphRenderer
  default_view: QuadRendererView
  type: 'QuadRenderer'


QuadRenderer::display_defaults = _.clone(QuadRenderer::display_defaults)
_.extend(QuadRenderer::display_defaults, {

  fill: 'gray'
  fill_alpha: 1.0

  line_color: 'red'
  line_width: 1
  line_alpha: 1.0
  line_join: 'miter'
  line_cap: 'butt'
  line_dash: []

})

class QuadRenderers extends Backbone.Collection
  model: QuadRenderer

exports.quadrenderers = new QuadRenderers
exports.QuadRenderer = QuadRenderer
exports.QuadRendererView = QuadRendererView
