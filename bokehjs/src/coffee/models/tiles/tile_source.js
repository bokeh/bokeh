import {ImagePool} from "./image_pool";
import {ProjectionUtils} from "./tile_utils";
import {logger} from "core/logging";
import * as p from "core/properties";
import {Model} from "../../model"

export class TileSource extends Model {
  static initClass() {
    this.prototype.type = 'TileSource';

    this.define({
        url:            [ p.String, ''  ],
        tile_size:      [ p.Number, 256 ],
        max_zoom:       [ p.Number, 30  ],
        min_zoom:       [ p.Number, 0   ],
        extra_url_vars: [ p.Any,    {}  ],
        attribution:    [ p.String, ''  ],
        x_origin_offset:    [ p.Number ],
        y_origin_offset:    [ p.Number ],
        initial_resolution: [ p.Number ]
    });
  }

  initialize(attrs: any, options: any): void {
    super.initialize(attrs, options);
    this.utils = new ProjectionUtils();
    this.pool = new ImagePool();
    this.tiles = {};
    this.normalize_case();
  }

  string_lookup_replace(str, lookup) {
    let result_str = str;
    for (let key in lookup) {
      const value = lookup[key];
      result_str = result_str.replace(`{${key}}`, value.toString());
    }
    return result_str;
  }

  normalize_case() {
    'Note: should probably be refactored into subclasses.';
    let { url } = this;
    url = url.replace('{x}','{X}');
    url = url.replace('{y}','{Y}');
    url = url.replace('{z}','{Z}');
    url = url.replace('{q}','{Q}');
    url = url.replace('{xmin}','{XMIN}');
    url = url.replace('{ymin}','{YMIN}');
    url = url.replace('{xmax}','{XMAX}');
    url = url.replace('{ymax}','{YMAX}');
    return this.url = url;
  }

  update() {
    logger.debug(`TileSource: tile cache count: ${Object.keys(this.tiles).length}`);
    for (let key in this.tiles) {
      const tile = this.tiles[key];
      tile.current = false;
      tile.retain = false;
    }
  }

  tile_xyz_to_key(x, y, z) {
    const key = `${x}:${y}:${z}`;
    return key;
  }

  key_to_tile_xyz(key) {
    return (key.split(':').map((c) => parseInt(c)));
  }

  sort_tiles_from_center(tiles, tile_extent) {
    const [txmin, tymin, txmax, tymax] = tile_extent;
    const center_x = ((txmax - txmin) / 2) + txmin;
    const center_y = ((tymax - tymin) / 2) + tymin;
    tiles.sort(function(a, b) {
      const a_distance = Math.sqrt(Math.pow(center_x - a[0], 2) + Math.pow(center_y - a[1], 2));
      const b_distance = Math.sqrt(Math.pow(center_x - b[0], 2) + Math.pow(center_y - b[1], 2));
      return a_distance - b_distance;
    });
    return tiles;
  }

  prune_tiles() {
    let tile;
    for (const key in this.tiles) {
      tile = this.tiles[key];
      tile.retain = tile.current || (tile.tile_coords[2] < 3); // save the parents...they are cheap
      if (tile.current) {
        this.retain_neighbors(tile);
        this.retain_children(tile);
        this.retain_parents(tile);
      }
    }

    for (key in this.tiles) {
      tile = this.tiles[key];
      if (!tile.retain)
        this.remove_tile(key);
    }
  }

  remove_tile(key) {
    const tile = this.tiles[key];
    if (tile != null) {
      this.pool.push(tile.img);
      return delete this.tiles[key];
    }
  }

  get_image_url(x, y, z) {
    const image_url = this.string_lookup_replace(this.url, this.extra_url_vars);
    return image_url.replace("{X}", x).replace('{Y}', y).replace("{Z}", z);
  }

  retain_neighbors(reference_tile) {
    throw new Error("Not Implemented");
  }

  retain_parents(reference_tile) {
    throw new Error("Not Implemented");
  }

  retain_children(reference_tile) {
    throw new Error("Not Implemented");
  }

  tile_xyz_to_quadkey(x, y, z) {
    throw new Error("Not Implemented");
  }

  quadkey_to_tile_xyz(quadkey) {
    throw new Error("Not Implemented");
  }
}
TileSource.initClass();
