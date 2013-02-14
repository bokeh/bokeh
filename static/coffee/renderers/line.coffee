
glyph = require('../glyph')
Glyph = glyph.Glyph
line_properties = glyph.line_properties

glyph_renderer = require('../glyph_renderers')
GlyphRenderer = glyph_renderer.GlyphRenderer
GlyphRendererView = glyph_renderer.GlyphRendererView


class LineRendererView extends GlyphRendererView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph = new Glyph(
      @,
      glyphspec,
      ['xs', 'ys'],
      [
        new line_properties(@, glyphspec)
      ]
    )

    @do_stroke = true #glyph.line_properties.do_stroke
    super(options)

  _render: (data) ->
    ctx = @plot_view.ctx

    ctx.save()

    if @glyph.fast_path
      @_fast_path(ctx, @glyph)
    else
      @_full_path(ctx, @glyph, data)

    ctx.restore()

  # TODO save screen coords

  _fast_path: (ctx, glyph) ->
    if @do_stroke
      glyph.line_properties.set(ctx, glyph)
      for pt in data
        x = glyph.select('xs', pt)
        y = glyph.select('ys', pt)

        [sx, sy] = @map_to_screen(x, glyph.xs.units, y, glyph.ys.units)

        for i in [0..sx.length-1]
          if i == 0
            ctx.beginPath()
            ctx.moveTo(sx[i], sy[i])
            continue
          else if isNaN(sx[i]) or isNaN(sy[i])
            ctx.stroke()
            ctx.beginPath()
            continue
          else
            ctx.lineTo(sx[i], sy[i])
        ctx.stroke()

  _full_path: (ctx, glyph, data) ->
    if @do_stroke
      for pt in data
        x = glyph.select('xs', pt)
        y = glyph.select('ys', pt)

        [sx, sy] = @map_to_screen(x, glyph.xs.units, y, glyph.ys.units)

        glyph.line_properties.set(ctx, pt)
        for i in [0..sx.length-1]
          if i == 0
            ctx.beginPath()
            ctx.moveTo(sx[i], sy[i])
            continue
          else if isNaN(sx[i]) or isNaN(sy[i])
            ctx.stroke()
            ctx.beginPath()
            continue
          else
            ctx.lineTo(sx[i], sy[i])
        ctx.stroke()


class LineRenderer extends GlyphRenderer
  default_view: LineRendererView
  type: 'LineRenderer'


LineRenderer::display_defaults = _.clone(LineRenderer::display_defaults)
_.extend(LineRenderer::display_defaults, {

  line_color: 'red'
  line_width: 1
  line_alpha: 1.0
  line_join: 'miter'
  line_cap: 'butt'
  line_dash: []

})

class LineRenderers extends Backbone.Collection
  model: LineRenderer

exports.linerenderers = new LineRenderers
exports.LineRenderer = LineRenderer
exports.LineRendererView = LineRendererView

