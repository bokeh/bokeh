
glyph = require('../glyph')
Glyph = glyph.Glyph
fill_properties = glyph.fill_properties
line_properties = glyph.line_properties

glyph_renderer = require('../glyph_renderers')
GlyphRenderer = glyph_renderer.GlyphRenderer
GlyphRendererView = glyph_renderer.GlyphRendererView


class CircleRendererView extends GlyphRendererView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph = new Glyph(
      @,
      glyphspec,
      ['x', 'y', 'radius']
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

    x = (glyph.select('x', obj) for obj in data)
    y = (glyph.select('y', obj) for obj in data)
    [@sx, @sy] = @map_to_screen(x, glyph.x.units, y, glyph.y.units)
    @radius = @distance(data, 'x', 'radius', 'edge')

    if @glyph.fast_path
      @_fast_path(ctx, glyph)
    else
      @_full_path(ctx, glyph, data)

    ctx.restore()

  _fast_path: (ctx, glyph) ->
    if @do_fill
      glyph.fill_properties.set(ctx, glyph)
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @radius[i])
          continue
        ctx.beginPath()
        ctx.arc(@sx[i], @sy[i], @radius[i], 0, 2*Math.PI*2, false)
        ctx.fill()

    if @do_stroke
      glyph.line_properties.set(ctx, glyph)
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @radius[i])
          continue
        ctx.beginPath()
        ctx.arc(@sx[i], @sy[i], @radius[i], 0, 2*Math.PI*2, false)
        ctx.stroke()

  _full_path: (ctx, glyph, data) ->
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i] + @radius[i])
        continue

      ctx.beginPath()
      ctx.arc(@sx[i], @sy[i], @radius[i], 0, 2*Math.PI*2, false)

      if @do_fill
        glyph.fill_properties.set(ctx, data[i])
        ctx.fill()

      if @do_stroke
        glyph.line_properties.set(ctx, data[i])
        ctx.stroke()


class CircleRenderer extends GlyphRenderer
  default_view: CircleRendererView
  type: 'CircleRenderer'


CircleRenderer::display_defaults = _.clone(CircleRenderer::display_defaults)
_.extend(CircleRenderer::display_defaults, {

  fill: 'gray'
  fill_alpha: 1.0

  line_color: 'red'
  line_width: 1
  line_alpha: 1.0
  line_join: 'miter'
  line_cap: 'butt'
  line_dash: []

})


class CircleRenderers extends Backbone.Collection
  model: CircleRenderer


exports.circlerenderers = new CircleRenderers
exports.CircleRenderer = CircleRenderer
exports.CircleRendererView = CircleRendererView

