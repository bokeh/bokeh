
glyph = require('../glyph')
Glyph = glyph.Glyph

glyph_renderer = require('../glyph_renderers')
GlyphRenderer = glyph_renderer.GlyphRenderer
GlyphRendererView = glyph_renderer.GlyphRendererView


class ImageRendererView extends GlyphRendererView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph = new Glyph(
      @,
      glyphspec,
      ['image:string', 'x', 'y', 'angle'],
      []
    )

    super(options)

  _render: (data) ->
    ctx = @plot_view.ctx
    glyph = @glyph

    ctx.save()

    x = (glyph.select('x', obj) for obj in data)
    y = (glyph.select('y', obj) for obj in data)
    [@sx, @sy] = @map_to_screen(x, glyph.x.units, y, glyph.y.units)
    @image = (glyph.select('image', obj) for obj in data)
    @angle = (glyph.select('angle', obj) for obj in data) # TODO deg/rad

    # fast and slow paths are the same
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i]+ @angle[i])
        continue

      img = new Image()
      img.onload = do (img, i) =>
        return () =>
          if @angle[i]
            ctx.translate(@sx[i], @sy[i])
            ctx.rotate(@angle[i])
            ctx.drawImage(img, 0, 0);
            ctx.rotate(-@angle[i])
            ctx.translate(-@sx[i], -@sy[i])
          else
            ctx.drawImage(img, @sx[i], @sy[i]);
      img.src = @image[i]

    ctx.restore()


class ImageRenderer extends GlyphRenderer
  default_view: ImageRendererView
  type: 'ImageRenderer'


ImageRenderer::display_defaults = _.clone(ImageRenderer::display_defaults)
_.extend(ImageRenderer::display_defaults, {})


class ImageRenderers extends Backbone.Collection
  model: ImageRenderer


exports.imagerenderers = new ImageRenderers
exports.ImageRenderer = ImageRenderer
exports.ImageRendererView = ImageRendererView

