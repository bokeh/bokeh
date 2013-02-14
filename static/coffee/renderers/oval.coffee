
glyph = require('../glyph')
Glyph = glyph.Glyph
fill_properties = glyph.fill_properties
line_properties = glyph.line_properties

glyph_renderer = require('../glyph_renderers')
GlyphRenderer = glyph_renderer.GlyphRenderer
GlyphRendererView = glyph_renderer.GlyphRendererView


class OvalRendererView extends GlyphRendererView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph = new Glyph(
      @,
      glyphspec,
      ['x', 'y', 'width', 'height', 'angle'],
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
    @sw = @distance(data, 'x', 'width', 'center')
    @sh = @distance(data, 'y', 'height', 'center')
    @angle = (glyph.select('angle', obj) for obj in data) # TODO deg/rad

    if @glyph.fast_path
      @_fast_path(ctx, glyph)
    else
      @_full_path(ctx, glyph, data)

    ctx.restore()

  _fast_path: (ctx, glyph) ->
    if @do_fill
      glyph.fill_properties.set(ctx, glyph)
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i] + @angle[i])
          continue

        ctx.translate(@sx[i], @sy[i])
        ctx.rotate(@angle[i])

        ctx.beginPath()
        ctx.moveTo(0, -@sh[i]/2)
        ctx.bezierCurveTo( @sw[i]/2, -@sh[i]/2,  @sw[i]/2,  @sh[i]/2, 0,  @sh[i]/2);
        ctx.bezierCurveTo(-@sw[i]/2,  @sh[i]/2, -@sw[i]/2, -@sh[i]/2, 0, -@sh[i]/2);
        ctx.closePath()
        ctx.fill()

        ctx.rotate(-@angle[i])
        ctx.translate(-@sx[i], -@sy[i])

    if @do_fill
      glyph.line_properties.set(ctx, glyph)
      ctx.beginPath()
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i] + @angle[i])
          continue

        ctx.translate(@sx[i], @sy[i])
        ctx.rotate(@angle[i])

        ctx.moveTo(0, -@sh[i]/2)
        ctx.bezierCurveTo( @sw[i]/2, -@sh[i]/2,  @sw[i]/2,  @sh[i]/2, 0,  @sh[i]/2);
        ctx.bezierCurveTo(-@sw[i]/2,  @sh[i]/2, -@sw[i]/2, -@sh[i]/2, 0, -@sh[i]/2);

        ctx.rotate(-@angle[i])
        ctx.translate(-@sx[i], -@sy[i])
      ctx.stroke()

  _full_path: (ctx, glyph, data) ->
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i] + @angle[i])
        continue

      ctx.translate(@sx[i], @sy[i])
      ctx.rotate(@angle[i])

      ctx.beginPath()
      ctx.moveTo(0, -@sh[i]/2)
      ctx.bezierCurveTo( @sw[i]/2, -@sh[i]/2,  @sw[i]/2,  @sh[i]/2, 0,  @sh[i]/2);
      ctx.bezierCurveTo(-@sw[i]/2,  @sh[i]/2, -@sw[i]/2, -@sh[i]/2, 0, -@sh[i]/2);
      ctx.closePath()

      if @do_fill
        glyph.fill_properties.set(ctx, data[i])
        ctx.fill()

      if @do_stroke
        glyph.line_properties.set(ctx, data[i])
        ctx.stroke()

      ctx.rotate(-@angle[i])
      ctx.translate(-@sx[i], -@sy[i])


class OvalRenderer extends GlyphRenderer
  default_view: OvalRendererView
  type: 'OvalRenderer'


OvalRenderer::display_defaults = _.clone(OvalRenderer::display_defaults)
_.extend(OvalRenderer::display_defaults, {

  fill: 'gray'
  fill_alpha: 1.0

  line_color: 'red'
  line_width: 1
  line_alpha: 1.0
  line_join: 'miter'
  line_cap: 'butt'
  line_dash: []

  angle: 0.0

})

class OvalRenderers extends Backbone.Collection
  model: OvalRenderer

exports.ovalrenderers = new OvalRenderers
exports.OvalRenderer = OvalRenderer
exports.OvalRendererView = OvalRendererView
