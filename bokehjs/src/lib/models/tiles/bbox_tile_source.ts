import {MercatorTileSource} from './mercator_tile_source'
import * as p from "core/properties"

export namespace BBoxTileSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = MercatorTileSource.Props & {
    use_latlon: p.Property<boolean>
  }
}

export interface BBoxTileSource extends BBoxTileSource.Attrs {}

export class BBoxTileSource extends MercatorTileSource {
  properties: BBoxTileSource.Props

  constructor(attrs?: Partial<BBoxTileSource.Attrs>) {
    super(attrs)
  }

  static init_BBoxTileSource(): void {
    this.define<BBoxTileSource.Props>(({Boolean}) => ({
      use_latlon: [ Boolean, false ],
    }))
  }

  get_image_url(x: number, y: number, z: number): string {
    const image_url = this.string_lookup_replace(this.url, this.extra_url_vars)

    let xmax: number, xmin: number, ymax: number, ymin: number
    if (this.use_latlon)
      [xmin, ymin, xmax, ymax] = this.get_tile_geographic_bounds(x, y, z)
    else
      [xmin, ymin, xmax, ymax] = this.get_tile_meter_bounds(x, y, z)

    return image_url
      .replace("{XMIN}", xmin.toString())
      .replace("{YMIN}", ymin.toString())
      .replace("{XMAX}", xmax.toString())
      .replace("{YMAX}", ymax.toString())
  }
}
