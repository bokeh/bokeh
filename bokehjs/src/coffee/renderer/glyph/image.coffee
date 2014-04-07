
define [
  "underscore",
  "renderer/properties",
  "mapper/color/linear_color_mapper",
  "palettes/palettes",
  "./glyph",
], (_, Properties, LinearColorMapper, Palettes, Glyph) ->

  all_palettes = Palettes.all_palettes

  class ImageView extends Glyph.View

    _properties: []

    setup_server_data : () ->
      serversource = @mget_obj('server_data_source')
      # hack, call set data, becuase there are some attrs that we need
      # that are in it
      data = _.extend({}, @mget_obj('data_source').get('data'), serversource.get('data'))
      @mget_obj('data_source').set('data', data)
      @set_data(false)

      serversource.listen_for_heatmap_updates(@mget_obj('data_source'),
        @plot_view.x_range,
        @plot_view.y_range,
        @plot_view.view_state.get('inner_range_horizontal'),
        @plot_view.view_state.get('inner_range_vertical'),
      )


    initialize: (options) ->
      # the point of this is to support both efficient ArrayBuffers as well as dumb
      # arrays of arrays that the python interface currently uses. If the glyphspec
      # contains "rows" then it is assumed to be an ArrayBuffer with explicitly
      # provided number of rows/cols, otherwise treat as a "list of lists".
      spec = @mget('glyphspec')
      if spec.rows?
        @_fields = ['image:array', 'rows', 'cols', 'x', 'y', 'dw', 'dh', 'palette:string']
      else
        @_fields = ['image:array', 'x', 'y', 'dw', 'dh', 'palette:string']
      super(options)

    _set_data: (@data) ->
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
        ctx = canvas.getContext('2d')
        image_data = ctx.getImageData(0, 0, @width[i], @height[i])
        cmap = new LinearColorMapper.Model({
          palette: all_palettes[@palette[i]]
        })
        if @rows?
          img = @image[i]
        else
          img = _.flatten(@image[i])
        buf = cmap.v_map_screen(img)
        buf8 = new Uint8ClampedArray(buf);
        image_data.data.set(buf8)
        ctx.putImageData(image_data, 0, 0);
        @image_data[i] = canvas

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      @sw = @distance_vector('x', 'dw', 'edge',  @mget('glyphspec')['dilate'])
      @sh = @distance_vector('y', 'dh', 'edge',  @mget('glyphspec')['dilate'])

    _render: (ctx, indices, glyph_props) ->
      old_smoothing = ctx.getImageSmoothingEnabled()
      ctx.setImageSmoothingEnabled(false)

      for i in indices
        if not this.image_data[i]?
          continue
        if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i])
          continue

        y_offset = @sy[i]

        ctx.translate(0, y_offset)
        ctx.scale(1, -1)
        ctx.translate(0, -y_offset)
        ctx.drawImage(@image_data[i], @sx[i]|0, @sy[i]|0, @sw[i], @sh[i])
        ctx.translate(0, y_offset)
        ctx.scale(1, -1)
        ctx.translate(0, -y_offset)

      ctx.setImageSmoothingEnabled(old_smoothing)

  # name Image conflicts with js Image
  class ImageGlyph extends Glyph.Model
    default_view: ImageView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        level: 'underlay'
        dilate: false
      })

  return {
    "Model": ImageGlyph,
    "View": ImageView,
  }
