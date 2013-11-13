
define [
  "underscore",
  "renderer/properties",
  "mapper/color/linear_color_mapper",
  "palettes/palettes",
  "./glyph",
], (_, Properties, LinearColorMapper, Palettes, Glyph) ->

  glyph_properties = Properties.glyph_properties
  line_properties  = Properties.line_properties
  fill_properties  = Properties.fill_properties

  all_palettes = Palettes.all_palettes

  class ImageView extends Glyph.View

    initialize: (options) ->
      glyphspec = @mget('glyphspec')
      @glyph_props = new glyph_properties(
        @,
        glyphspec,
        ['image:array', 'width', 'height', 'x', 'y', 'dw', 'dh', 'palette:string'],
        []
      )

      super(options)

    _set_data: (@data) ->
      @x = @glyph_props.v_select('x', data)
      @y = @glyph_props.v_select('y', data)
      h = @glyph_props.v_select('dh', data)
      for i in [0..@y.length-1]
        @y[i] += h[i]
      @pal = @glyph_props.v_select('palette', data)

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
        cmap = new LinearColorMapper({}, {
          palette: all_palettes[@pal[i]]
        })
        buf = cmap.v_map_screen(img[i])
        buf8 = new Uint8ClampedArray(buf);
        image_data.data.set(buf8)
        ctx.putImageData(image_data, 0, 0);
        @image_data[i] = canvas

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
        ctx.scale(1,-1)
        ctx.translate(0, -y_offset)
        ctx.drawImage(@image_data[i], @sx[i]|0, @sy[i]|0, @sw[i], @sh[i])
        ctx.translate(0, y_offset)
        ctx.scale(1,-1)
        ctx.translate(0, -y_offset)

      ctx.setImageSmoothingEnabled(old_smoothing)
      ctx.restore()

  # name Image conflicts with js Image
  class ImageGlyph extends Glyph.Model
    default_view: ImageView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        level: 'underlay'
      })

  return {
    "Model": ImageGlyph,
    "View": ImageView,
  }

