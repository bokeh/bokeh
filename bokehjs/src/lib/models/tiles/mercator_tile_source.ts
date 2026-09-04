import {TileSource} from "./tile_source"
import type * as p from "core/properties"
import {logger} from "core/logging"
import type {Extent, Bounds} from "./tile_utils"
import {meters_extent_to_geographic} from "./tile_utils"
import {range} from "core/util/array"

export namespace MercatorTileSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TileSource.Props & {
    snap_to_zoom: p.Property<boolean>
    wrap_around: p.Property<boolean>
  } & Internal

  export type Internal = {
    _resolutions: p.Property<number[]>
  }
}

export interface MercatorTileSource extends MercatorTileSource.Attrs {}

export class MercatorTileSource extends TileSource {
  declare properties: MercatorTileSource.Props

  static {
    this.define<MercatorTileSource.Props>(({Bool}) => ({
      snap_to_zoom: [ Bool, false ],
      wrap_around:  [ Bool, true ],
    }))

    this.internal<MercatorTileSource.Internal, MercatorTileSource>(({Float, List}) => ({
      _resolutions: [ List(Float), (obj) => { // TODO computed property of min_zoom, max_zoom, etc.
        return range(obj.min_zoom, obj.max_zoom+1).map((z) => obj.get_resolution(z))
      } ],
    }))

    this.override<MercatorTileSource.Props>({
      x_origin_offset:    20037508.34,
      y_origin_offset:    20037508.34,
      initial_resolution: 156543.03392804097,
    })
  }

  /**
   * The coarsest zoom level provided by this source.
   */
  get min_level(): number {
    return Math.max(0, Math.floor(this.min_zoom))
  }

  /**
   * The finest zoom level provided by this source.
   */
  get max_level(): number {
    return Math.max(this.min_level, Math.floor(this.max_zoom))
  }

  protected _computed_initial_resolution(): number {
    if (this.initial_resolution != null) {
      return this.initial_resolution
    } else {
      // TODO testing 2015-11-17, if this codepath is used it seems
      // to use 100% cpu and wedge Chrome
      return (2 * Math.PI * 6378137) / this.tile_size
    }
  }

  is_valid_tile(x: number, y: number, z: number): boolean {
    if (z < this.min_level || z > this.max_level) {
      return false
    }

    if (!this.wrap_around) {
      if (x < 0 || x >= 2**z) {
        return false
      }
    }

    if (y < 0 || y >= 2**z) {
      return false
    }

    return true
  }

  get_resolution(level: number): number {
    return this._computed_initial_resolution() / 2**level
  }

  get_resolution_by_extent(extent: Extent, height: number, width: number): [number, number] {
    const x_rs = (extent[2] - extent[0]) / width
    const y_rs = (extent[3] - extent[1]) / height
    return [x_rs, y_rs]
  }

  /**
   * The resolution needed to fit `extent` into `width` x `height` pixels.
   */
  protected _required_resolution(extent: Extent, height: number, width: number): number {
    const [x_rs, y_rs] = this.get_resolution_by_extent(extent, height, width)
    return Math.max(x_rs, y_rs)
  }

  /**
   * The finest level whose tiles still cover `extent`, i.e. the extent is
   * never cropped, at the cost of drawing tiles magnified up to 2x.
   */
  get_level_by_extent(extent: Extent, height: number, width: number): number {
    const resolution = this._required_resolution(extent, height, width)
    const {min_level, max_level} = this

    if (!isFinite(resolution)) {
      return min_level
    }

    for (let level = min_level; level <= max_level; level++) {
      if (resolution > this.get_resolution(level)) {
        return Math.max(min_level, level - 1)
      }
    }

    return max_level
  }

  /**
   * The level whose resolution is closest to the one `extent` requires, which
   * keeps tiles within a factor of sqrt(2) of their native size.
   */
  get_closest_level_by_extent(extent: Extent, height: number, width: number): number {
    const resolution = this._required_resolution(extent, height, width)
    const {min_level, max_level} = this

    if (!isFinite(resolution) || resolution <= 0) {
      return min_level
    }

    // resolutions form a geometric series, so proximity is measured as a ratio,
    // not as an absolute difference
    let closest = min_level
    let closest_distance = Infinity
    for (let level = min_level; level <= max_level; level++) {
      const distance = Math.abs(Math.log2(this.get_resolution(level)/resolution))
      if (distance >= closest_distance) {
        break
      }
      closest = level
      closest_distance = distance
    }

    return closest
  }

  /**
   * `extent` grown or shrunk around its center to `resolution` in both axes.
   */
  protected _extent_at_resolution(extent: Extent, height: number, width: number, resolution: number): Extent {
    const [xmin, ymin, xmax, ymax] = extent
    const x_adjust = ((width*resolution) - (xmax - xmin)) / 2
    const y_adjust = ((height*resolution) - (ymax - ymin)) / 2
    return [xmin - x_adjust, ymin - y_adjust, xmax + x_adjust, ymax + y_adjust]
  }

  snap_to_zoom_level(extent: Extent, height: number, width: number, level: number): Extent {
    const resolution = this.snap_to_zoom ? this.get_resolution(level) : this._required_resolution(extent, height, width)
    return this._extent_at_resolution(extent, height, width, resolution)
  }

  /**
   * `extent` adjusted so that both axes resolve to the same number of meters
   * per pixel, by growing the axis that has room to spare. Tiles are square, so
   * an extent that scales the axes independently (as a box zoom, a single
   * dimension wheel zoom, or an auto-ranged range does) draws them distorted.
   */
  constrain_extent(extent: Extent, height: number, width: number): Extent {
    if (!extent.every(isFinite) || !(width > 0) || !(height > 0)) {
      return extent
    }

    if (this.snap_to_zoom) {
      const level = this.get_level_by_extent(extent, height, width)
      return this.snap_to_zoom_level(extent, height, width, level)
    }

    const [xmin, ymin, xmax, ymax] = extent
    const [x_rs, y_rs] = this.get_resolution_by_extent(extent, height, width)

    // only the axis that has to grow is touched, so that constraining an extent
    // that already is consistent doesn't perturb it
    if (x_rs > y_rs) {
      const y_adjust = ((height*x_rs) - (ymax - ymin))/2
      return [xmin, ymin - y_adjust, xmax, ymax + y_adjust]
    } else {
      const x_adjust = ((width*y_rs) - (xmax - xmin))/2
      return [xmin - x_adjust, ymin, xmax + x_adjust, ymax]
    }
  }

  rescale(extent: Extent, height: number, width: number, last_height: number, last_width: number): Extent {
    if (!(last_width > 0) || !(last_height > 0)) {
      return extent
    }

    const [xmin, ymin, xmax, ymax] = extent
    const x_delta = xmax-xmin
    const y_delta = ymax-ymin

    const x_scale = width/last_width
    const y_scale = height/last_height

    const desired_x_delta = x_delta*x_scale
    const desired_y_delta = y_delta*y_scale

    const x_adjust = desired_x_delta - x_delta
    const y_adjust = desired_y_delta - y_delta

    return [xmin - x_adjust/2, ymin - y_adjust/2, xmax + x_adjust/2, ymax + y_adjust/2]
  }

  tms_to_wmts(x: number, y: number, z: number): [number, number, number] {
    // Note this works both ways
    return [x, 2**z - 1 - y, z]
  }

  wmts_to_tms(x: number, y: number, z: number): [number, number, number] {
    // Note this works both ways
    return [x, 2**z - 1 - y, z]
  }

  pixels_to_meters(px: number, py: number, level: number): [number, number] {
    const res = this.get_resolution(level)
    const mx = (px * res) - this.x_origin_offset
    const my = (py * res) - this.y_origin_offset
    return [mx, my]
  }

  meters_to_pixels(mx: number, my: number, level: number): [number, number] {
    const res = this.get_resolution(level)
    const px = (mx + this.x_origin_offset) / res
    const py = (my + this.y_origin_offset) / res
    return [px, py]
  }

  pixels_to_tile(px: number, py: number): [number, number] {
    const {tile_size} = this
    return [Math.floor(px / tile_size), Math.floor(py / tile_size)]
  }

  meters_to_tile(mx: number, my: number, level: number): [number, number] {
    const [px, py] = this.meters_to_pixels(mx, my, level)
    return this.pixels_to_tile(px, py)
  }

  get_tile_meter_bounds(tx: number, ty: number, level: number): Bounds {
    // expects tms styles coordinates (bottom-left origin)
    const [xmin, ymin] = this.pixels_to_meters(tx * this.tile_size, ty * this.tile_size, level)
    const [xmax, ymax] = this.pixels_to_meters((tx + 1) * this.tile_size, (ty + 1) * this.tile_size, level)
    return [xmin, ymin, xmax, ymax]
  }

  get_tile_geographic_bounds(tx: number, ty: number, level: number): Bounds {
    const bounds = this.get_tile_meter_bounds(tx, ty, level)
    const [minLon, minLat, maxLon, maxLat] = meters_extent_to_geographic(bounds)
    return [minLon, minLat, maxLon, maxLat]
  }

  get_tiles_by_extent(extent: Extent, level: number, tile_border: number = 1): [number, number, number, Bounds][] {
    // skip calculation if any axis has undefined extent
    if (extent.some(value => !isFinite(value))) {
      return []
    }

    // unpack extent and convert to tile coordinates
    const [xmin, ymin, xmax, ymax] = extent
    let [txmin, tymin] = this.meters_to_tile(xmin, ymin, level)
    let [txmax, tymax] = this.meters_to_tile(xmax, ymax, level)

    // add tiles which border
    txmin -= tile_border
    tymin -= tile_border
    txmax += tile_border
    tymax += tile_border

    // An extent that doesn't correspond to `level` (e.g. one that was never
    // constrained to the levels this source provides) can ask for an unbounded
    // number of tiles, so fall back to the tiles closest to the center.
    const nx = txmax - txmin + 1
    const ny = tymax - tymin + 1
    const {max_tiles} = this
    if (nx*ny > max_tiles) {
      logger.warn(`${this}: extent requires ${nx*ny} tiles at zoom level ${level}, limiting to ${max_tiles}`)
      const scale = Math.sqrt(max_tiles/(nx*ny))
      const cx = Math.max(1, Math.floor(nx*scale))
      const cy = Math.max(1, Math.floor(ny*scale))
      txmin += Math.floor((nx - cx)/2)
      txmax = txmin + cx - 1
      tymin += Math.floor((ny - cy)/2)
      tymax = tymin + cy - 1
    }

    const tiles: [number, number, number, Bounds][] = []
    for (let ty = tymax; ty >= tymin; ty--) {
      for (let tx = txmin; tx <= txmax; tx++) {
        if (this.is_valid_tile(tx, ty, level)) {
          tiles.push([tx, ty, level, this.get_tile_meter_bounds(tx, ty, level)])
        }
      }
    }

    this.sort_tiles_from_center(tiles, [txmin, tymin, txmax, tymax])
    return tiles
  }

  quadkey_to_tile_xyz(quadKey: string): [number, number, number] {
    /**
     * Computes tile x, y and z values based on quadKey.
     */
    let tileX = 0
    let tileY = 0
    const tileZ = quadKey.length
    for (let i = tileZ; i > 0; i--) {
      const value = quadKey.charAt(tileZ - i)
      const mask = 1 << (i - 1)

      switch (value) {
        case "0":
          continue
        case "1":
          tileX |= mask
          break
        case "2":
          tileY |= mask
          break
        case "3":
          tileX |= mask
          tileY |= mask
          break
        default:
          throw new TypeError(`Invalid Quadkey: ${quadKey}`)
      }
    }

    return [tileX, tileY, tileZ]
  }

  tile_xyz_to_quadkey(x: number, y: number, z: number): string {
    /*
     * Computes quadkey value based on tile x, y and z values.
     */
    let quadkey = ""
    for (let i = z; i > 0; i--) {
      const mask = 1 << (i - 1)
      let digit = 0
      if ((x & mask) !== 0) {
        digit += 1
      }
      if ((y & mask) !== 0) {
        digit += 2
      }
      quadkey += digit.toString()
    }
    return quadkey
  }

  children_by_tile_xyz(x: number, y: number, z: number): [number, number, number, Bounds][] {
    const quadkey = this.tile_xyz_to_quadkey(x, y, z)
    const child_tile_xyz: [number, number, number, Bounds][] = []

    for (let i = 0; i <= 3; i++) {
      const [cx, cy, cz] = this.quadkey_to_tile_xyz(quadkey + i.toString())
      if (this.is_valid_tile(cx, cy, cz)) {
        child_tile_xyz.push([cx, cy, cz, this.get_tile_meter_bounds(cx, cy, cz)])
      }
    }

    return child_tile_xyz
  }

  get_closest_parent_by_tile_xyz(x: number, y: number, z: number): [number, number, number] | null {
    const world_x = this.calculate_world_x_by_tile_xyz(x, y, z)
    ;[x, y, z] = this.normalize_xyz(x, y, z)
    let quadkey = this.tile_xyz_to_quadkey(x, y, z)
    while (quadkey.length > 0) {
      quadkey = quadkey.substring(0, quadkey.length - 1)
      const [px, py, pz] = this.denormalize_xyz(...this.quadkey_to_tile_xyz(quadkey), world_x)
      if (this.has_tile(this.tile_xyz_to_key(px, py, pz))) {
        return [px, py, pz]
      }
    }
    return null
  }

  normalize_xyz(x: number, y: number, z: number): [number, number, number] {
    if (this.wrap_around) {
      const tile_count = 2**z
      return [((x % tile_count) + tile_count) % tile_count, y, z]
    } else {
      return [x, y, z]
    }
  }

  denormalize_xyz(x: number, y: number, z: number, world_x: number): [number, number, number] {
    return [x + (world_x * 2**z), y, z]
  }

  calculate_world_x_by_tile_xyz(x: number, _y: number, z: number): number {
    return Math.floor(x / 2**z)
  }
}
