
glyph = require('../glyph')
Glyph = glyph.Glyph
line_properties = glyph.line_properties
fill_properties = glyph.fill_properties

glyph_renderer = require('../glyph_renderers')
GlyphRenderer = glyph_renderer.GlyphRenderer
GlyphRendererView = glyph_renderer.GlyphRendererView


class AreaRendererView extends GlyphRendererView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph = new Glyph(
      @,
      glyphspec,
      ['xs', 'ys']
      [
        new fill_properties(@, glyphspec),
        new line_properties(@, glyphspec)
      ]
    )

    @do_fill = true #@glyph.line_properties.do_fill
    @do_stroke = true #@glyph.line_properties.do_stroke
    super(options)

  # TODO store screen coords

  _render: (data) ->
    ctx = @plot_view.ctx
    glyph = @glyph

    ctx.save()

    for pt in data
      x = glyph.select('xs', pt)
      y = glyph.select('ys', pt)
      [sx, sy] = @map_to_screen(x, glyph.xs.units, y, glyph.ys.units)

      if @do_fill
        glyph.fill_properties.set(ctx, pt)
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
        glyph.line_properties.set(ctx, pt)
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


class AreaRenderer extends GlyphRenderer
  default_view: AreaRendererView
  type: 'AreaRenderer'


AreaRenderer::display_defaults = _.clone(AreaRenderer::display_defaults)
_.extend(AreaRenderer::display_defaults, {

  fill: 'gray'
  fill_alpha: 1.0

  line_color: 'red'
  line_width: 1
  line_alpha: 1.0
  line_join: 'miter'
  line_cap: 'butt'
  line_dash: []

})

class AreaRenderers extends Backbone.Collection
  model: AreaRenderer

exports.arearenderers = new AreaRenderers
exports.AreaRenderer = AreaRenderer
exports.AreaRendererView = AreaRendererView

