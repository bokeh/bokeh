
glyph = require('../glyph')
Glyph = glyph.Glyph
line_properties = glyph.line_properties

glyph_renderer = require('../glyph_renderers')
GlyphRenderer = glyph_renderer.GlyphRenderer
GlyphRendererView = glyph_renderer.GlyphRendererView


class SegmentRendererView extends GlyphRendererView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph = new Glyph(
      @,
      glyphspec,
      ['x0', 'y0', 'x1', 'y1'],
      [
        new line_properties(@, glyphspec)
      ]
    )

    @do_stroke = true #glyph.line_properties.do_stroke
    super(options)

  _render: (data) ->
    ctx = @plot_view.ctx
    glyph = @glyph

    ctx.save()

    x0 = (glyph.select('x0', obj) for obj in data)
    y0 = (glyph.select('y0', obj) for obj in data)
    [@sx0, @sy0] = @map_to_screen(x0, glyph.x0.units, y0, glyph.y0.units)

    x1 = (glyph.select('x1', obj) for obj in data)
    y1 = (glyph.select('y1', obj) for obj in data)
    [@sx1, @sy1] = @map_to_screen(x1, glyph.x1.units, y1, glyph.y1.units)


    if @glyph.fast_path
      @_fast_path(ctx, glyph)
    else
      @_full_path(ctx, glyph, data)

    ctx.restore()

  _fast_path: (ctx, glyph) ->
    if @do_stroke
      glyph.line_properties.set(ctx, glyph)
      ctx.beginPath()
      for i in [0..@sx0.length-1]
        if isNaN(@sx0[i] + @sy0[i] + @sx1[i] + @sy1[i])
          continue

        ctx.moveTo(@sx0[i], @sy0[i])
        ctx.lineTo(@sx1[i], @sy1[i])

      ctx.stroke()

  _full_path: (ctx, glyph, data) ->
    if @do_stroke
      for i in [0..@sx0.length-1]
        if isNaN(@sx0[i] + @sy0[i] + @sx1[i] + @sy1[i])
          continue

        ctx.beginPath()
        ctx.moveTo(@sx0[i], @sy0[i])
        ctx.lineTo(@sx1[i], @sy1[i])

        glyph.line_properties.set(ctx, data[i])
        ctx.stroke()


class SegmentRenderer extends GlyphRenderer
  default_view: SegmentRendererView
  type: 'SegmentRenderer'


SegmentRenderer::display_defaults = _.clone(SegmentRenderer::display_defaults)
_.extend(SegmentRenderer::display_defaults, {

  line_color: 'red'
  line_width: 1
  line_alpha: 1.0
  line_join: 'miter'
  line_cap: 'butt'
  line_dash: []

})

class SegmentRenderers extends Backbone.Collection
  model: SegmentRenderer

exports.segmentrenderers = new SegmentRenderers
exports.SegmentRenderer = SegmentRenderer
exports.SegmentRendererView = SegmentRendererView
