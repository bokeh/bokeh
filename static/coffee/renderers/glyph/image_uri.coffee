
properties = require('../properties')
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
    @url = (@glyph_props.select('url', obj) for obj in data)
    # TODO (bev) handle degrees in addition to radians
    angles = @glyph_props.v_select('angle', data)
    @angle = (-angle for angle in angles)
    @image = (null for img in @url)
    @need_load = (true for img in @url)
    @loaded = (false for img in @url)

  _render: () ->
    [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)

    ctx = @plot_view.ctx
    vs = @plot_view.view_state

    ctx.save()

    # fast and slow paths are the same
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i]+ @angle[i])
        continue

      if @need_load[i]
        img = new Image()
        img.onload = do (img, i) =>
          return () =>
            @loaded[i] = true
            @image[i] = img
            ctx.save()
            ctx.beginPath()
            # TODO should take the real axis rule width into account, for now shrink region by 1 px
            ctx.rect(
              vs.get('border_left')+1, vs.get('border_top')+1,
              vs.get('inner_width')-2, vs.get('inner_height')-2,
            )
            ctx.clip()
            @_render_image(ctx, vs, i, img)
            ctx.restore()
        img.src = @url[i]
        @need_load[i] = false

      else if @loaded[i]
        @_render_image(ctx, vs, i, @image[i])

    ctx.restore()

  _render_image: (ctx, vs, i, img) ->
    if @angle[i]
      ctx.translate(@sx[i], @sy[i])
      ctx.rotate(@angle[i])
      ctx.drawImage(img, 0, 0);
      ctx.rotate(-@angle[i])
      ctx.translate(-@sx[i], -@sy[i])
    else
      ctx.drawImage(img, @sx[i], @sy[i]);

# name Image conflicts with js Image
class ImageURIGlyph extends Glyph
  default_view: ImageURIView
  type: 'GlyphRenderer'


ImageURIGlyph::display_defaults = _.clone(ImageURIGlyph::display_defaults)
_.extend(ImageURIGlyph::display_defaults, {
  level: 'underlay'
})


exports.ImageURI = ImageURIGlyph
exports.ImageURIView = ImageURIView

