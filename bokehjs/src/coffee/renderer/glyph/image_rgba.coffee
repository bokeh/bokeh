
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  glyph_properties = Properties.glyph_properties

  class ImageRGBAView extends Glyph.View

    _properties: []

    initialize: (options) ->
      # the point of this is to support both efficient ArrayBuffers as well as dumb
      # arrays of arrays that the python interface currently uses. If the glyphspec
      # contains "rows" then it is assumed to be an ArrayBuffer with explicitly
      # provided number of rows/cols, otherwise treat as a "list of lists".
      spec = @mget('glyphspec')
      if spec.rows?
        @_fields = ['image:array', 'rows', 'cols', 'x', 'y', 'dw', 'dh']
      else
        @_fields = ['image:array', 'x', 'y', 'dw', 'dh']
      super(options)

    _set_data: () ->
      for i in [0...@y.length]
        @y[i] += @dh[i]

      if not @image_data? or @image_data.length != @image.length
        @image_data = new Array(@image.length)

      if not @width? or @width.length != @image.length
        @width = new Array(@image.length)

      if not @height? or @height.length != @image.length
        @height = new Array(@image.length)

      for i in [0...@image.length]
        if @rows?
          @height[i] = @rows[i]
          @width[i] = @cols[i]
        else
          @height[i] = @image[i].length
          @width[i] = @image[i][0].length
        canvas = document.createElement('canvas');
        canvas.width = @width[i];
        canvas.height = @height[i];
        ctx = canvas.getContext('2d');
        image_data = ctx.getImageData(0, 0, @width[i], @height[i]);
        if @rows?
          image_data.data.set(new Uint8ClampedArray(@image[i]))
        else
          flat = _.flatten(@image[i])
          buf = new ArrayBuffer(flat.length * 4);
          color = new Uint32Array(buf);
          for j in [0...flat.length]
            color[j] = flat[j]
          buf8 = new Uint8ClampedArray(buf);
          image_data.data.set(buf8)
        ctx.putImageData(image_data, 0, 0);
        @image_data[i] = canvas

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      @sw = @distance_vector('x', 'dw', 'edge')
      @sh = @distance_vector('y', 'dh', 'edge')

    _render: (ctx, indices, glyph_props) ->
      old_smoothing = ctx.getImageSmoothingEnabled()
      ctx.setImageSmoothingEnabled(false)

      for i in indices

        if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i])
          continue

        y_offset = @sy[i]+@sh[i]/2

        ctx.translate(0, y_offset)
        ctx.scale(1, -1)
        ctx.translate(0, -y_offset)
        ctx.drawImage(@image_data[i], @sx[i]|0, @sy[i]|0, @sw[i], @sh[i])
        ctx.translate(0, y_offset)
        ctx.scale(1, -1)
        ctx.translate(0, -y_offset)

      ctx.setImageSmoothingEnabled(old_smoothing)

  # name Image conflicts with js Image
  class ImageRGBAGlyph extends Glyph.Model
    default_view: ImageRGBAView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        level: 'underlay'
      })

  return {
    "Model": ImageRGBAGlyph,
    "View": ImageRGBAView,
  }
