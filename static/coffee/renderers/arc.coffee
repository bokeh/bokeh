
glyph = require('../glyph')
Glyph = glyph.Glyph
line_properties = glyph.line_properties

glyph_renderer = require('../glyph_renderers')
GlyphRenderer = glyph_renderer.GlyphRenderer
GlyphRendererView = glyph_renderer.GlyphRendererView


class ArcRendererView extends GlyphRendererView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph = new Glyph(
      @,
      glyphspec,
      ['x', 'y', 'radius', 'start_angle', 'end_angle', 'direction:string'],
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

    x = (glyph.select('x', obj) for obj in data)
    y = (glyph.select('y', obj) for obj in data)
    [@sx, @sy] = @map_to_screen(x, glyph.x.units, y, glyph.y.units)
    @radius = @distance(data, 'x', 'radius', 'edge')
    @start_angle = (glyph.select('start_angle', obj) for obj in data) # TODO deg/rad
    @end_angle = (glyph.select('end_angle', obj) for obj in data) # TODO deg/rad
    @direction = new Array(@sx.length)
    for i in [0..@sx.length-1]
      dir = glyph.select('direction', data[i])
      if dir == 'clock' then @direction[i] = false
      else if dir == 'anticlock' then @direction[i] = true
      else @direction[i] = NaN

    if @glyph.fast_path
      @_fast_path(ctx, glyph)
    else
      @_full_path(ctx, glyph, data)

    ctx.restore()

  _fast_path: (ctx, glyph) ->
    if @do_stroke
      glyph.line_properties.set(ctx, glyph)
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @radius[i] + @start_angle[i] + @end_angle[i] + @direction[i])
          continue
        ctx.beginPath()
        ctx.arc(@sx[i], @sy[i], @radius[i], @start_angle[i], @end_angle[i], @direction[i])
        ctx.stroke()

  _full_path: (ctx, glyph, data) ->
    if @do_stroke
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @radius[i] + @start_angle[i] + @end_angle[i] + @direction[i])
          continue

        ctx.beginPath()
        ctx.arc(@sx[i], @sy[i], @radius[i], @start_angle[i], @end_angle[i], @direction[i])

        glyph.line_properties.set(ctx, data[i])
        ctx.stroke()


class ArcRenderer extends GlyphRenderer
  default_view: ArcRendererView
  type: 'ArcRenderer'


ArcRenderer::display_defaults = _.clone(ArcRenderer::display_defaults)
_.extend(ArcRenderer::display_defaults, {

  line_color: 'red'
  line_width: 1
  line_alpha: 1.0
  line_join: 'miter'
  line_cap: 'butt'
  line_dash: []

})


class ArcRenderers extends Backbone.Collection
  model: ArcRenderer


exports.arcrenderers = new ArcRenderers
exports.ArcRenderer = ArcRenderer
exports.ArcRendererView = ArcRendererView

