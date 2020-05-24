import {Model} from "../../model"
import {Extent, Bounds} from "./tile_utils"
import {entries} from "core/util/object"
import * as p from "core/properties"

export type Tile = {
  tile_coords: [number, number, number]
}

export namespace TileSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    url: p.Property<string>
    tile_size: p.Property<number>
    max_zoom: p.Property<number>
    min_zoom: p.Property<number>
    extra_url_vars: p.Property<{[key: string]: string}>
    attribution: p.Property<string>
    x_origin_offset: p.Property<number>
    y_origin_offset: p.Property<number>
    initial_resolution: p.Property<number>
  }
}

export interface TileSource extends TileSource.Attrs {}

export abstract class TileSource extends Model {
  properties: TileSource.Props

  constructor(attrs?: Partial<TileSource.Attrs>) {
    super(attrs)
  }

  static init_TileSource(): void {
    this.define<TileSource.Props>({
      url:                [ p.String, ''  ],
      tile_size:          [ p.Number, 256 ],
      max_zoom:           [ p.Number, 30  ],
      min_zoom:           [ p.Number, 0   ],
      extra_url_vars:     [ p.Any,    {}  ],
      attribution:        [ p.String, ''  ],
      x_origin_offset:    [ p.Number      ],
      y_origin_offset:    [ p.Number      ],
      initial_resolution: [ p.Number      ],
    })
  }

  tiles: Map<string, Tile>

  initialize(): void {
    super.initialize()
    this.tiles = new Map()
    this._normalize_case()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.change, () => this._clear_cache())
  }

  string_lookup_replace(str: string, lookup: {[key: string]: string}): string {
    let result_str = str
    for (const [key, value] of entries(lookup)) {
      result_str = result_str.replace(`{${key}}`, value)
    }
    return result_str
  }

  protected _normalize_case(): void {
    /*
     * Note: should probably be refactored into subclasses.
     */
    const url = this.url
      .replace('{x}', '{X}')
      .replace('{y}', '{Y}')
      .replace('{z}', '{Z}')
      .replace('{q}', '{Q}')
      .replace('{xmin}', '{XMIN}')
      .replace('{ymin}', '{YMIN}')
      .replace('{xmax}', '{XMAX}')
      .replace('{ymax}', '{YMAX}')
    this.url = url
  }

  protected _clear_cache(): void {
    this.tiles = new Map()
  }

  tile_xyz_to_key(x: number, y: number, z: number): string {
    return `${x}:${y}:${z}`
  }

  key_to_tile_xyz(key: string): [number, number, number] {
    const [x, y, z] = key.split(':').map((c) => parseInt(c))
    return [x, y, z]
  }

  sort_tiles_from_center(tiles: [number, number, number, Bounds][], tile_extent: Extent): void {
    const [txmin, tymin, txmax, tymax] = tile_extent
    const center_x = ((txmax - txmin) / 2) + txmin
    const center_y = ((tymax - tymin) / 2) + tymin
    tiles.sort(function(a, b) {
      const a_distance = Math.sqrt((center_x - a[0])**2 + (center_y - a[1])**2)
      const b_distance = Math.sqrt((center_x - b[0])**2 + (center_y - b[1])**2)
      return a_distance - b_distance
    })
  }

  get_image_url(x: number, y: number, z: number): string {
    const image_url = this.string_lookup_replace(this.url, this.extra_url_vars)
    return image_url
      .replace("{X}", x.toString())
      .replace('{Y}', y.toString())
      .replace("{Z}", z.toString())
  }

  abstract tile_xyz_to_quadkey(x: number, y: number, z: number): string

  abstract quadkey_to_tile_xyz(quadkey: string): [number, number, number]

  abstract children_by_tile_xyz(x: number, y: number, z: number): [number, number, number, Bounds][]

  abstract get_closest_parent_by_tile_xyz(x: number, y: number, z: number): [number, number, number]

  abstract get_tiles_by_extent(extent: Extent, level: number, tile_border?: number): [number, number, number, Bounds][]

  abstract get_level_by_extent(extent: Extent, height: number, width: number): number

  abstract snap_to_zoom_level(extent: Extent, height: number, width: number, level: number): Extent

  abstract normalize_xyz(x: number, y: number, z: number): [number, number, number]
}
