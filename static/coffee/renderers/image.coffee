
properties = require('./properties')
glyph_properties = properties.glyph_properties

colorbrewer = require('../palettes/colorbrewer').colorbrewer
ColorMapper = require('../color_mapper').ColorMapper

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class ImageView extends GlyphView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['image:array', 'width', 'height', 'x', 'y', 'dw', 'dh'],
      []
    )

    super(options)

  set_data: (@data) ->
    @x = @glyph_props.v_select('x', data)
    @y = @glyph_props.v_select('y', data)
    h = @glyph_props.v_select('dh', data)
    for i in [0..@y.length-1]
      @y[i] += h[i]

    @sw = @distance(@data, 'x', 'dw', 'edge')
    @sh = @distance(@data, 'y', 'dh', 'edge')

    width = @glyph_props.v_select('width', data)
    height = @glyph_props.v_select('height', data)
    img = (@glyph_props.select('image', obj) for obj in data)

    @image_data = new Array(data.length)
    for i in [0..data.length-1]
      canvas = document.createElement('canvas');
      canvas.width = width[i];
      canvas.height = height[i];
      ctx = canvas.getContext('2d');
      image_data = ctx.getImageData(0, 0, width[i], height[i]);
      cmap = new ColorMapper(colorbrewer.Blues[8])
      # cmap = new ColorMapper([0x000000, 0x080808, 0x101010, 0x181818, 0x202020, 0x292929, 0x313131, 0x393939, 0x414141, 0x4a4a4a, 0x525252, 0x5a5a5a, 0x626262, 0x6a6a6a, 0x737373, 0x7b7b7b, 0x838383, 0x8b8b8b, 0x949494, 0x9c9c9c, 0xa4a4a4, 0xacacac, 0xb4b4b4, 0xbdbdbd, 0xc5c5c5, 0xcdcdcd, 0xd5d5d5, 0xdedede, 0xe6e6e6, 0xeeeeee, 0xf6f6f6, 0xffffff])
      # cmap = new ColorMapper([0x000000, 0x111111, 0x222222, 0x333333, 0x444444, 0x555555, 0x666666, 0x777777, 0x888888, 0x999999, 0xaaaaaa, 0xbbbbbb, 0xcccccc, 0xdddddd, 0xeeeeee, 0xffffff])
      buf = cmap.v_map_screen(img[i])
      buf8 = new Uint8ClampedArray(buf);
      image_data.data.set(buf8)
      ctx.putImageData(image_data, 0, 0);
      @image_data[i] = canvas

  _render: () ->
    [@sx, @sy] = @map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)

    ctx = @plot_view.ctx

    ctx.save()
    old_smoothing = ctx.getImageSmoothingEnabled()
    ctx.setImageSmoothingEnabled(false)

    # fast and slow paths are the same
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i])
        continue

      y_offset = @sy[i]+@sh[i]/2

      ctx.translate(0, y_offset)
      ctx.scale(1,-1)
      ctx.translate(0, -y_offset)
      ctx.drawImage(@image_data[i], @sx[i]|0, @sy[i]|0, @sw[i], @sh[i])
      ctx.scale(1,1)

    ctx.setImageSmoothingEnabled(old_smoothing)
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

