
properties = require('./properties')
glyph_properties = properties.glyph_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class ImageView extends GlyphView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['image:string', 'x', 'y', 'angle'],
      []
    )

    super(options)

  _render: (data) ->
    ctx = @plot_view.ctx
    glyph_props = @glyph_props

    ctx.save()

    x = (glyph_props.select('x', obj) for obj in data)
    y = (glyph_props.select('y', obj) for obj in data)
    [@sx, @sy] = @map_to_screen(x, glyph_props.x.units, y, glyph_props.y.units)
    @image_src = (glyph_props.select('image', obj) for obj in data)
    @angle = (glyph_props.select('angle', obj) for obj in data) # TODO deg/rad

    @img = new Array(@image_src.length)

    # fast and slow paths are the same
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i]+ @angle[i])
        continue

      @img[i] = new Image()
      @img[i].onload = do (i) =>
        return () =>
          if @angle[i]
            ctx.translate(@sx[i], @sy[i])
            ctx.rotate(@angle[i])
            ctx.drawImage(@img[i], 0, 0);
            console.log @sx[i], @sy[i]
            ctx.rotate(-@angle[i])
            ctx.translate(-@sx[i], -@sy[i])
          else
            ctx.drawImage(@img[i], @sx[i], @sy[i]);
      @img[i].src = @image_src[i]

    ctx.restore()


class Image extends Glyph
  default_view: ImageView
  type: 'GlyphRenderer'


Image::display_defaults = _.clone(Image::display_defaults)
_.extend(Image::display_defaults, {})


class Images extends Backbone.Collection
  model: Image


exports.images = new Images
exports.Image = Image
exports.ImageView = ImageView

