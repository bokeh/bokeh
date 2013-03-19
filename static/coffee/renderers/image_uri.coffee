
properties = require('./properties')
glyph_properties = properties.glyph_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class ImageURIView extends GlyphView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['url:string', 'x', 'y', 'angle'],
      []
    )

    super(options)

  _set_data: (@data) ->
    @x = @glyph_props.v_select('x', data)
    @y = @glyph_props.v_select('y', data)
    @image = (@glyph_props.select('url', obj) for obj in data)
    @angle = (@glyph_props.select('angle', obj) for obj in data) # TODO deg/rad

  _render: () ->
    [@sx, @sy] = @map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)

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
class ImageURIGlyph extends Glyph
  default_view: ImageURIView
  type: 'GlyphRenderer'


ImageURIGlyph::display_defaults = _.clone(ImageURIGlyph::display_defaults)
_.extend(ImageURIGlyph::display_defaults, {})


class ImageURIs extends Backbone.Collection
  model: ImageURIGlyph


exports.image_uriss = new ImageURIs
exports.ImageURI = ImageURIGlyph
exports.ImageURIView = ImageURIView

