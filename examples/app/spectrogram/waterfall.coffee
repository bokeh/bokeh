_ = require "underscore"

p = require "core/properties"
DataSource = require "models/sources/data_source"
LinearColorMapper = require "models/mappers/linear_color_mapper"

class WaterfallSource extends DataSource.Model
  type: 'WaterfallSource'

  initialize: (attrs, options) ->
    super(attrs, options)
    @_cmap = new LinearColorMapper.Model({'palette': @palette, low: 0, high: 5})

    num_images = Math.ceil(@num_grams/@tile_width) + 1

    images = new Array(num_images)
    for i in [0..(num_images-1)]
      images[i] = new ArrayBuffer(@gram_length * @tile_width * 4)

    xs = new Array(num_images)
    for i in [0...num_images]
      xs[i] = -@tile_width*(i+2)

    @_col = 0

    @_tile = 0

    @attributes.data = {image: images, x: xs}

    @listenTo(@, 'change:latest', () => @update())

  update: () ->
    buf = @_cmap.v_map_screen(@latest)

    for i in [0...@data.x.length]
      @data.x[i] += 1

    @_col -= 1
    if @_col == -1

      @_col = @tile_width - 1
      @_tile -= 1

      if @_tile == -1
        @_tile = @data.x.length - 1

      @data.x[@_tile] = -@tile_width

    image32 = new Uint32Array(@data.image[@_tile])
    buf32 = new Uint32Array(buf)

    for i in [0...@gram_length]
      image32[i*@tile_width+@_col] = buf32[i]

  columns: () ->
    return _.keys(@data)

  get_column: (colname) ->
    return @data[colname] ? null

  get_length: () ->
    lengths = _.uniq((val.length for key, val of @data))
    return lengths[0]

  @define {
    latest:      [ p.Any ]
    palette:     [ p.Any ]
    num_grams:   [ p.Int ]
    gram_length: [ p.Int ]
    tile_width:  [ p.Int ]
  }

  @internal {
    data:         [ p.Any,   {} ]
    column_names: [ p.Array, [] ]
    inspected:    [ p.Any       ]
  }

module.exports =
  Model: WaterfallSource
