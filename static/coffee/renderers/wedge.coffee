
glyph = require('../glyph')
Glyph = glyph.Glyph
fill_properties = glyph.fill_properties
line_properties = glyph.line_properties

glyph_renderer = require('../glyph_renderers')
GlyphRenderer = glyph_renderer.GlyphRenderer
GlyphRendererView = glyph_renderer.GlyphRendererView


class WedgeRendererView extends GlyphRendererView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph = new Glyph(
      @,
      glyphspec,
      ['x', 'y', 'radius', 'start_angle', 'end_angle'],
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

    x = (@glyph.select('x', obj) for obj in data)
    y = (@glyph.select('y', obj) for obj in data)
    [@sx, @sy] = @map_to_screen(x, @glyph.x.units, y, @glyph.y.units)
    @radius = @distance(data, 'x', 'radius', 'edge')
    @start_angle = (@glyph.select('start_angle', obj) for obj in data) # TODO deg/rad
    @end_angle = (@glyph.select('end_angle', obj) for obj in data) # TODO deg/rad

    if @glyph.fast_path
      @_fast_path(ctx, glyph)
    else
      @_full_path(ctx, glyph, data)

    ctx.restore()

  _fast_path: (ctx, glyph) ->
    if @do_fill
      glyph.fill_properties.set(ctx, glyph)
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @radius[i] + @start_angle[i] + @end_angle[i])
          continue

        ctx.beginPath()
        ctx.arc(@sx[i], @sy[i], @radius[i], @start_angle[i], @end_angle[i], false)
        ctx.lineTo(@sx[i], @sy[i])
        ctx.closePath()
        ctx.fill()

    if @do_stroke
      glyph.line_properties.set(ctx, glyph)
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @radius[i] + @start_angle[i] + @end_angle[i])
          continue

        ctx.beginPath()
        ctx.arc(@sx[i], @sy[i], @radius[i], @start_angle[i], @end_angle[i], false)
        ctx.lineTo(@sx[i], @sy[i])
        ctx.closePath()
        ctx.stroke()

  _full_path: (ctx, glyph, data) ->
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i] + @radius[i] + @start_angle[i] + @end_angle[i])
        continue

      ctx.beginPath()
      ctx.arc(@sx[i], @sy[i], @radius[i], @start_angle[i], @end_angle[i], false)
      ctx.lineTo(@sx[i], @sy[i])
      ctx.closePath()

      if @do_fill
        glyph.fill_properties.set(ctx, data[i])
        ctx.fill()

      if @do_stroke
        glyph.line_properties.set(ctx, data[i])
        ctx.stroke()


class WedgeRenderer extends GlyphRenderer
  default_view: WedgeRendererView
  type: 'WedgeRenderer'


WedgeRenderer::display_defaults = _.clone(WedgeRenderer::display_defaults)
_.extend(WedgeRenderer::display_defaults, {

  fill: 'gray'
  fill_alpha: 1.0

  line_color: 'red'
  line_width: 1
  line_alpha: 1.0
  line_join: 'miter'
  line_cap: 'butt'
  line_dash: []

})

class WedgeRenderers extends Backbone.Collection
  model: WedgeRenderer

exports.wedgerenderers = new WedgeRenderers
exports.WedgeRenderer = WedgeRenderer
exports.WedgeRendererView = WedgeRendererView
