
properties = require('./properties')
glyph_properties = properties.glyph_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class ImageRGBAView extends GlyphView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['image:array', 'width', 'height', 'x', 'y', 'dw', 'dh'],
      []
    )

    super(options)

  _set_data: (@data) ->
    @x = @glyph_props.v_select('x', data)
    @y = @glyph_props.v_select('y', data)
    h = @glyph_props.v_select('dh', data)
    for i in [0..@y.length-1]
      @y[i] += h[i]

    width = @glyph_props.v_select('width', data)
    height = @glyph_props.v_select('height', data)
    img = (@glyph_props.select('image', obj) for obj in data)

    if not @image_data? or @image_data.length != data.length
      @image_data = new Array(data.length)

    for i in [0..data.length-1]
      if not @image_data[i]?
        @image_data[i] = document.createElement('canvas')
      if @image_data[i].width != width[i] or @image_data[i].height != height[i]
        @image_data[i].width = width[i];
        @image_data[i].height = height[i];
      ctx = @image_data[i].getContext('2d');
      img_data = ctx.createImageData(width[i], height[i])
      img_data.data.set(new Uint8ClampedArray(img[i]))
      ctx.putImageData(img_data, 0, 0);

  _render: () ->
    [@sx, @sy] = @map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
    @sw = @distance(@data, 'x', 'dw', 'edge')
    @sh = @distance(@data, 'y', 'dh', 'edge')

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
class ImageRGBAGlyph extends Glyph
  default_view: ImageRGBAView
  type: 'GlyphRenderer'


ImageRGBAGlyph::display_defaults = _.clone(ImageRGBAGlyph::display_defaults)
_.extend(ImageRGBAGlyph::display_defaults, {})


class ImageRGBAs extends Backbone.Collection
  model: ImageRGBAGlyph


exports.image_rgbas = new ImageRGBAs
exports.ImageRGBA = ImageRGBAGlyph
exports.ImageRGBAView = ImageRGBAView

