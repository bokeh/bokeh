import {MercatorTileSource} from './mercator_tile_source'
import * as p from "core/properties"

export namespace WMTSTileSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = MercatorTileSource.Props
}

export interface WMTSTileSource extends WMTSTileSource.Attrs {}

export class WMTSTileSource extends MercatorTileSource {
  properties: WMTSTileSource.Props

  constructor(attrs?: Partial<WMTSTileSource.Attrs>) {
    super(attrs)
  }

  get_image_url(x: number, y: number, z: number): string {
    const image_url = this.string_lookup_replace(this.url, this.extra_url_vars)
    const [wx, wy, wz] = this.tms_to_wmts(x, y, z)
    return image_url.replace("{X}", wx.toString())
                    .replace('{Y}', wy.toString())
                    .replace("{Z}", wz.toString())
  }
}
