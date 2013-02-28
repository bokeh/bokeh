
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

  set_data: (@data) ->
    x = @glyph_props.v_select('x', data)
    y = @glyph_props.v_select('y', data)
    [@sx, @sy] = @map_to_screen(x, @glyph_props.x.units, y, @glyph_props.y.units)
    @image = (@glyph_props.select('image', obj) for obj in data)
    @angle = (@glyph_props.select('angle', obj) for obj in data) # TODO deg/rad

  _render: () ->
    ctx = @plot_view.ctx

    ctx.save()

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

# name Image conflicts with js Image
class ImageGlyph extends Glyph
  default_view: ImageView
  type: 'GlyphRenderer'


ImageGlyph::display_defaults = _.clone(ImageGlyph::display_defaults)
_.extend(ImageGlyph::display_defaults, {})


class Images extends Backbone.Collection
  model: ImageGlyph


exports.images = new Images
exports.Image = ImageGlyph
exports.ImageView = ImageView

