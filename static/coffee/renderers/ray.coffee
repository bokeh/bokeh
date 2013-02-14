
glyph = require('../glyph')
Glyph = glyph.Glyph
line_properties = glyph.line_properties

glyph_renderer = require('../glyph_renderers')
GlyphRenderer = glyph_renderer.GlyphRenderer
GlyphRendererView = glyph_renderer.GlyphRendererView


class RayRendererView extends GlyphRendererView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph = new Glyph(
      @,
      glyphspec,
      ['x', 'y', 'angle', 'length'],
      [
        new line_properties(@, glyphspec)
      ]
    )

    @do_stroke = true #@glyph.line_properties.do_stroke
    super(options)

  _render: (data) ->
    ctx = @plot_view.ctx
    glyph = @glyph

    ctx.save()

    width = @plot_view.viewstate.get('width')
    height = @plot_view.viewstate.get('height')
    inf_len = 2 * (width + height)

    x = (glyph.select('x', obj) for obj in data)
    y = (glyph.select('y', obj) for obj in data)
    [@sx, @sy] = @map_to_screen(x, glyph.x.units, y, glyph.y.units)
    @angle = (glyph.select('angle', obj) for obj in data) # TODO deg/rad
    @length = (glyph.select('length', obj) for obj in data)
    for i in [0..@sx.length-1]
      if @length[i] == 0 then @length[i] = inf_len

    if @glyph.fast_path
      @_fast_path(ctx, glyph)
    else
      @_full_path(ctx, glyph, data)

    ctx.restore()

  _fast_path: (ctx, glyph) ->
    if @do_stroke
      glyph.line_properties.set(ctx, glyph)
      ctx.beginPath()
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @angle[i] + @length[i])
          continue

        ctx.translate(@sx[i], @sy[i])
        ctx.rotate(@angle[i])
        ctx.moveTo(0,  0)
        ctx.lineTo(@length[i], 0) # TODO handle @length in data units?
        ctx.rotate(-@angle[i])
        ctx.translate(-@sx[i], -@sy[i])

      ctx.stroke()

  _full_path: (ctx, glyph, data) ->
    if @do_stroke
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @angle[i] + @length[i])
          continue

        ctx.translate(@sx[i], @sy[i])
        ctx.rotate(@angle[i])

        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(@length[i], 0) # TODO handle @length in data units?

        glyph.line_properties.set(ctx, data[i])
        ctx.stroke()

        ctx.rotate(-@angle[i])
        ctx.translate(-@sx[i], -@sy[i])


class RayRenderer extends GlyphRenderer
  default_view: RayRendererView
  type: 'RayRenderer'


RayRenderer::display_defaults = _.clone(RayRenderer::display_defaults)
_.extend(RayRenderer::display_defaults, {

  line_color: 'red'
  line_width: 1
  line_alpha: 1.0
  line_join: 'miter'
  line_cap: 'butt'
  line_dash: []

})

class RayRenderers extends Backbone.Collection
  model: RayRenderer

exports.rayrenderers = new RayRenderers
exports.RayRenderer = RayRenderer
exports.RayRendererView = RayRendererView

