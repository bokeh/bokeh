
properties = require('../properties')
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

    if not @image_canvas? or @image_canvas.length != data.length
      @image_canvas = new Array(data.length)

    for i in [0..data.length-1]
      if not @image_canvas[i]? or (@image_canvas[i].width != width[i] or @image_canvas[i].height != height[i])
        @image_canvas[i] = document.createElement('canvas')
        @image_canvas[i].width = width[i];
        @image_canvas[i].height = height[i];
        ctx = @image_canvas[i].getContext('2d');
        @image_data[i] = ctx.createImageData(width[i], height[i])
      ctx = @image_canvas[i].getContext('2d');
      @image_data[i].data.set(new Uint8ClampedArray(img[i]))
      ctx.putImageData(@image_data[i], 0, 0);

  _render: () ->
    [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
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
      ctx.scale(1, -1)
      ctx.translate(0, -y_offset)
      ctx.drawImage(@image_canvas[i], @sx[i]|0, @sy[i]|0, @sw[i], @sh[i])
      ctx.translate(0, y_offset)
      ctx.scale(1, -1)
      ctx.translate(0, -y_offset)

    ctx.setImageSmoothingEnabled(old_smoothing)
    ctx.restore()

# name Image conflicts with js Image
class ImageRGBAGlyph extends Glyph
  default_view: ImageRGBAView
  type: 'GlyphRenderer'


ImageRGBAGlyph::display_defaults = _.clone(ImageRGBAGlyph::display_defaults)
_.extend(ImageRGBAGlyph::display_defaults, {
  level: 'underlay'
})


exports.ImageRGBA = ImageRGBAGlyph
exports.ImageRGBAView = ImageRGBAView

