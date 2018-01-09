/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {TileSource} from "./tile_source";
import * as p from "core/properties";
import {includes, range} from "core/util/array";

export class MercatorTileSource extends TileSource {
  static initClass() {
    this.prototype.type = 'MercatorTileSource';

    this.define({
      snap_to_zoom:       [ p.Bool,   false              ],
      wrap_around:        [ p.Bool,   true               ]
    });

    this.override({
      x_origin_offset:    20037508.34,
      y_origin_offset:    20037508.34,
      initial_resolution: 156543.03392804097
    });
  }

  initialize(options) {
    super.initialize(options);
    return this._resolutions = (range(this.min_zoom, this.max_zoom+1).map((z) => this.get_resolution(z)));
  }

  _computed_initial_resolution() {
    if (this.initial_resolution != null) {
      return this.initial_resolution;
    } else {
      // TODO testing 2015-11-17, if this codepath is used it seems
      // to use 100% cpu and wedge Chrome
      return (2 * Math.PI * 6378137) / this.tile_size;
    }
  }

  is_valid_tile(x, y, z) {

    if (!this.wrap_around) {
      if ((x < 0) || (x >= Math.pow(2, z))) {
        return false;
      }
    }

    if ((y < 0) || (y >= Math.pow(2, z))) {
      return false;
    }

    return true;
  }

  retain_children(reference_tile) {
    const { quadkey } = reference_tile;
    const min_zoom = quadkey.length;
    const max_zoom = min_zoom + 3;
    return (() => {
      const result = [];
      for (let key in this.tiles) {
        const tile = this.tiles[key];
        if ((tile.quadkey.indexOf(quadkey) === 0) && (tile.quadkey.length > min_zoom) && (tile.quadkey.length <= max_zoom)) {
          result.push(tile.retain = true);
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }

  retain_neighbors(reference_tile) {
    const neighbor_radius = 4;
    const [tx, ty, tz] = Array.from(reference_tile.tile_coords);
    const neighbor_x = (range(tx - neighbor_radius, tx + neighbor_radius+1));
    const neighbor_y = (range(ty - neighbor_radius, ty + neighbor_radius+1));

    return (() => {
      const result = [];
      for (let key in this.tiles) {
        const tile = this.tiles[key];
        if (tile.tile_coords[2] === tz && includes(neighbor_x, tile.tile_coords[0])
                                       && includes(neighbor_y, tile.tile_coords[1])) {
          result.push(tile.retain = true);
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }

  retain_parents(reference_tile) {
    const { quadkey } = reference_tile;
    return (() => {
      const result = [];
      for (let key in this.tiles) {
        const tile = this.tiles[key];
        result.push(tile.retain = quadkey.indexOf(tile.quadkey) === 0);
      }
      return result;
    })();
  }

  children_by_tile_xyz(x, y, z) {
    const world_x = this.calculate_world_x_by_tile_xyz(x, y, z);

    if (world_x !== 0) {
      [x, y, z] = Array.from(this.normalize_xyz(x, y, z));
    }

    const quad_key = this.tile_xyz_to_quadkey(x, y, z);
    const child_tile_xyz = [];
    for (let i = 0; i <= 3; i++) {
      [x, y, z] = Array.from(this.quadkey_to_tile_xyz(quad_key + i.toString()));
      if (world_x !== 0) {
        [x, y, z] = Array.from(this.denormalize_xyz(x, y, z, world_x));
      }
      const b = this.get_tile_meter_bounds(x, y, z);
      if (b != null) {
        child_tile_xyz.push([x, y, z, b]);
      }
    }
    return child_tile_xyz;
  }

  parent_by_tile_xyz(x, y, z) {
    const quad_key = this.tile_xyz_to_quadkey(x, y, z);
    const parent_quad_key = quad_key.substring(0, quad_key.length - 1);
    return this.quadkey_to_tile_xyz(parent_quad_key);
  }

  get_resolution(level) {
    return this._computed_initial_resolution() / Math.pow(2, level);
  }

  get_resolution_by_extent(extent, height, width) {
    const x_rs = (extent[2] - extent[0]) / width;
    const y_rs = (extent[3] - extent[1]) / height;
    return [x_rs, y_rs];
  }

  get_level_by_extent(extent, height, width) {
    const x_rs = (extent[2] - extent[0]) / width;
    const y_rs = (extent[3] - extent[1]) / height;
    const resolution = Math.max(x_rs, y_rs);
    let i = 0;
    for (let r of Array.from(this._resolutions)) {
      if (resolution > r) {
        if (i === 0) { return 0; }
        if (i > 0) { return i - 1; }
      }
      i += 1;
    }
  }

  get_closest_level_by_extent(extent, height, width) {
    const x_rs = (extent[2] - extent[0]) / width;
    const y_rs = (extent[3] - extent[1]) / height;
    const resolution = Math.max(x_rs, y_rs);
    const ress = this._resolutions;
    const closest = this._resolutions.reduce(function(previous, current) {
      if (Math.abs(current - resolution) < Math.abs(previous - resolution)) { return current; }
      return previous;
    });
    return this._resolutions.indexOf(closest);
  }

  snap_to_zoom_level(extent, height, width, level) {
    const [xmin, ymin, xmax, ymax] = Array.from(extent);
    const desired_res = this._resolutions[level];
    let desired_x_delta = width * desired_res;
    let desired_y_delta = height * desired_res;
    if (!this.snap_to_zoom) {
      const xscale = (xmax-xmin)/desired_x_delta;
      const yscale = (ymax-ymin)/desired_y_delta;
      if (xscale > yscale) {
        desired_x_delta = (xmax-xmin);
        desired_y_delta = desired_y_delta*xscale;
      } else {
        desired_x_delta = desired_x_delta*yscale;
        desired_y_delta = (ymax-ymin);
      }
    }
    const x_adjust = (desired_x_delta - (xmax - xmin)) / 2;
    const y_adjust = (desired_y_delta - (ymax - ymin)) / 2;

    return [xmin - x_adjust, ymin - y_adjust, xmax + x_adjust, ymax + y_adjust];
  }

  tms_to_wmts(x, y, z) {
    'Note this works both ways';
    return [x, Math.pow(2, z) - 1 - y, z];
  }

  wmts_to_tms(x, y, z) {
    'Note this works both ways';
    return [x, Math.pow(2, z) - 1 - y, z];
  }

  pixels_to_meters(px, py, level) {
    const res = this.get_resolution(level);
    const mx = (px * res) - this.x_origin_offset;
    const my = (py * res) - this.y_origin_offset;
    return [mx, my];
  }

  meters_to_pixels(mx, my, level) {
    const res = this.get_resolution(level);
    const px = (mx + this.x_origin_offset) / res;
    const py = (my + this.y_origin_offset) / res;
    return [px, py];
  }

  pixels_to_tile(px, py) {
    let tx = Math.ceil(px / parseFloat(this.tile_size));
    tx = tx === 0 ? tx : tx - 1;
    const ty = Math.max(Math.ceil(py / parseFloat(this.tile_size)) - 1, 0);
    return [tx, ty];
  }

  pixels_to_raster(px, py, level) {
    const mapSize = this.tile_size << level;
    return [px, mapSize - py];
  }

  meters_to_tile(mx, my, level) {
    const [px, py] = Array.from(this.meters_to_pixels(mx, my, level));
    return this.pixels_to_tile(px, py);
  }

  get_tile_meter_bounds(tx, ty, level) {
    // expects tms styles coordinates (bottom-left origin)
    const [xmin, ymin] = Array.from(this.pixels_to_meters(tx * this.tile_size, ty * this.tile_size, level));
    const [xmax, ymax] = Array.from(this.pixels_to_meters((tx + 1) * this.tile_size, (ty + 1) * this.tile_size, level));

    if ((xmin != null) && (ymin != null) && (xmax != null) && (ymax != null)) {
      return [xmin, ymin, xmax, ymax];
    } else {
      return undefined;
    }
  }

  get_tile_geographic_bounds(tx, ty, level) {
    const bounds = this.get_tile_meter_bounds(tx, ty, level);
    const [minLon, minLat, maxLon, maxLat] = Array.from(this.utils.meters_extent_to_geographic(bounds));
    return [minLon, minLat, maxLon, maxLat];
  }

  get_tiles_by_extent(extent, level, tile_border) {
    // unpack extent and convert to tile coordinates
    if (tile_border == null) { tile_border = 1; }
    const [xmin, ymin, xmax, ymax] = Array.from(extent);
    let [txmin, tymin] = Array.from(this.meters_to_tile(xmin, ymin, level));
    let [txmax, tymax] = Array.from(this.meters_to_tile(xmax, ymax, level));

    // add tiles which border
    txmin -= tile_border;
    tymin -= tile_border;
    txmax += tile_border;
    tymax += tile_border;

    let tiles = [];
    for (let ty = tymax, end = tymin; ty >= end; ty--) {
      for (let tx = txmin, end1 = txmax; tx <= end1; tx++) {
        if (this.is_valid_tile(tx, ty, level)) {
          tiles.push([tx, ty, level, this.get_tile_meter_bounds(tx, ty, level)]);
        }
      }
    }

    tiles = this.sort_tiles_from_center(tiles, [txmin, tymin, txmax, tymax]);
    return tiles;
  }

  quadkey_to_tile_xyz(quadKey) {
    `\
Computes tile x, y and z values based on quadKey.\
`;
    let tileX = 0;
    let tileY = 0;
    const tileZ = quadKey.length;
    for (let i = tileZ; i > 0; i--) {

      const value = quadKey.charAt(tileZ - i);
      const mask = 1 << (i - 1);

      switch (value) {
        case '0':
          continue;
          break;
        case '1':
          tileX |= mask;
          break;
        case '2':
          tileY |= mask;
          break;
        case '3':
          tileX |= mask;
          tileY |= mask;
          break;
        default:
          throw new TypeError(`Invalid Quadkey: ${quadKey}`);
      }
    }

    return [tileX, tileY, tileZ];
  }

  tile_xyz_to_quadkey(x, y, z) {
    `\
Computes quadkey value based on tile x, y and z values.\
`;
    let quadKey = '';
    for (let i = z; i > 0; i--) {
      let digit = 0;
      const mask = 1 << (i - 1);
      if((x & mask) !== 0) {
        digit += 1;
      }
      if((y & mask) !== 0) {
        digit += 2;
      }
      quadKey += digit.toString();
    }
    return quadKey;
  }

  children_by_tile_xyz(x, y, z) {
    const quad_key = this.tile_xyz_to_quadkey(x, y, z);
    const child_tile_xyz = [];
    for (let i = 0; i <= 3; i++) {
      [x, y, z] = Array.from(this.quadkey_to_tile_xyz(quad_key + i.toString()));
      const b = this.get_tile_meter_bounds(x, y, z);
      if (b != null) {
        child_tile_xyz.push([x, y, z, b]);
      }
    }

    return child_tile_xyz;
  }

  parent_by_tile_xyz(x, y, z) {
    const quad_key = this.tile_xyz_to_quadkey(x, y, z);
    const parent_quad_key = quad_key.substring(0, quad_key.length - 1);
    return this.quadkey_to_tile_xyz(parent_quad_key);
  }

  get_closest_parent_by_tile_xyz(x, y, z) {
    const world_x = this.calculate_world_x_by_tile_xyz(x, y, z);
    [x, y, z] = Array.from(this.normalize_xyz(x, y, z));
    let quad_key = this.tile_xyz_to_quadkey(x, y, z);
    while (quad_key.length > 0) {
      quad_key = quad_key.substring(0, quad_key.length - 1);
      [x, y, z] = Array.from(this.quadkey_to_tile_xyz(quad_key));
      [x, y, z] = Array.from(this.denormalize_xyz(x, y, z, world_x));
      if (this.tile_xyz_to_key(x, y, z) in this.tiles) {
          return [x, y, z];
        }
    }
    return [0, 0, 0];
  }

  normalize_xyz(x, y, z) {
    if (this.wrap_around) {
      const tile_count = Math.pow(2, z);
      return [((x % tile_count) + tile_count) % tile_count, y, z];
    } else {
      return [x, y, z];
    }
  }

  denormalize_xyz(x, y, z, world_x) {
    return [x + (world_x * Math.pow(2, z)), y, z];
  }

  denormalize_meters(meters_x, meters_y, level, world_x) {
    return [meters_x + (world_x * 2 * Math.PI * 6378137), meters_y];
  }

  calculate_world_x_by_tile_xyz(x, y, z) {
    return Math.floor(x / Math.pow(2, z));
  }
}
MercatorTileSource.initClass();
