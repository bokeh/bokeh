_ = require "underscore"

p = require "core/properties"
ColumnDataSource = require "models/sources/column_data_source"
LinearColorMapper = require "models/mappers/linear_color_mapper"

class WaterfallSource extends ColumnDataSource.Model
  type: 'WaterfallSource'

  initialize: (attrs, options) ->
    super(attrs, options)
    @_cmap = new LinearColorMapper.Model({'palette': @palette, low: 0, high: 5})

    num_images = Math.ceil(@num_grams/@tile_width) + 1

    @_images = new Array(num_images)
    for i in [0..(num_images-1)]
      @_images[i] = new ArrayBuffer(@gram_length * @tile_width * 4)

    @_xs = new Array(num_images)

    @_col = 0

    @listenTo(@, 'change:latest', () => @update())

  update: () ->
    buf = @_cmap.v_map_screen(@latest)

    for i in [0...@_xs.length]
      @_xs[i] += 1

    @_col -= 1
    if @_col == -1
      @_col = @tile_width - 1
      img = @_images.pop()
      @_images = [img].concat(@_images[0..])
      @_xs.pop()
      @_xs = [1-@tile_width].concat(@_xs[0..])
      #@set('data', {image: @_images, x: @_xs}, {silent: true})
      @get('data')['image'] = @_images
      @get('data')['x'] = @_xs

    image32 = new Uint32Array(@_images[0])
    buf32 = new Uint32Array(buf)

    for i in [0...@gram_length]
      image32[i*@tile_width+@_col] = buf32[i]

    @get('data')['x'] = @_xs
    @trigger('change', true, 0)

  @define {
    latest:      [ p.Any ]
    palette:     [ p.Any ]
    num_grams:   [ p.Int ]
    gram_length: [ p.Int ]
    tile_width:  [ p.Int ]
  }

 module.exports =
  Model: WaterfallSource