import {ImagePool} from "./image_pool"
import {ProjectionUtils} from "./tile_utils"
import {logger} from "core/logging"
import * as p from "core/properties"
import {Model} from "../../model"

export class TileSource extends Model
  type: 'TileSource'

  @define {
      url:            [ p.String, ''  ]
      tile_size:      [ p.Number, 256 ]
      max_zoom:       [ p.Number, 30  ]
      min_zoom:       [ p.Number, 0   ]
      extra_url_vars: [ p.Any,    {}  ]
      attribution:    [ p.String, ''  ]
      x_origin_offset:    [ p.Number ]
      y_origin_offset:    [ p.Number ]
      initial_resolution: [ p.Number ]
  }

  initialize: (options) ->
    super(options)
    @normalize_case()

  constructor: (options={}) ->
    super
    @utils = new ProjectionUtils()
    @pool = new ImagePool()
    @tiles = {}
    @normalize_case()

  string_lookup_replace: (str, lookup) ->
    result_str = str
    for key, value of lookup
      result_str = result_str.replace('{'+key+'}', value.toString())
    return result_str

  normalize_case:() ->
    '''Note: should probably be refactored into subclasses.'''
    url = @url
    url = url.replace('{x}','{X}')
    url = url.replace('{y}','{Y}')
    url = url.replace('{z}','{Z}')
    url = url.replace('{q}','{Q}')
    url = url.replace('{xmin}','{XMIN}')
    url = url.replace('{ymin}','{YMIN}')
    url = url.replace('{xmax}','{XMAX}')
    url = url.replace('{ymax}','{YMAX}')
    @url = url

  update: () ->
    logger.debug("TileSource: tile cache count: #{Object.keys(@tiles).length}")
    for key, tile of @tiles
      tile.current = false
      tile.retain = false

  tile_xyz_to_key: (x, y, z) ->
    key = "#{x}:#{y}:#{z}"
    return key

  key_to_tile_xyz: (key) ->
    return (parseInt(c) for c in key.split(':'))

  sort_tiles_from_center: (tiles, tile_extent) ->
    [txmin, tymin, txmax, tymax] = tile_extent
    center_x = (txmax - txmin) / 2 + txmin
    center_y = (tymax - tymin) / 2 + tymin
    tiles.sort (a, b) ->
      a_distance = Math.sqrt(Math.pow(center_x - a[0], 2) + Math.pow(center_y - a[1], 2))
      b_distance = Math.sqrt(Math.pow(center_x - b[0], 2) + Math.pow(center_y - b[1], 2))
      return a_distance - b_distance
    return tiles

  prune_tiles: () ->
    for key, tile of @tiles
      tile.retain = tile.current or tile.tile_coords[2] < 3 # save the parents...they are cheap
      if tile.current
        @retain_neighbors(tile)
        @retain_children(tile)
        @retain_parents(tile)

    for key, tile of @tiles
      if not tile.retain
        @remove_tile(key)

  remove_tile: (key) ->
    tile = @tiles[key]
    if tile?
      @pool.push(tile.img)
      delete @tiles[key]

  get_image_url: (x, y, z) ->
    image_url = @string_lookup_replace(@url, @extra_url_vars)
    return image_url.replace("{X}", x).replace('{Y}', y).replace("{Z}", z)

  retain_neighbors: (reference_tile) ->
    throw Error("Not Implemented")

  retain_parents: (reference_tile) ->
    throw Error("Not Implemented")

  retain_children: (reference_tile) ->
    throw Error("Not Implemented")

  tile_xyz_to_quadkey: (x, y, z) ->
    throw Error("Not Implemented")

  quadkey_to_tile_xyz: (quadkey) ->
    throw Error("Not Implemented")
