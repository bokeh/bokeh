import {MercatorTileSource} from "./mercator_tile_source"
import * as p from "core/properties"

export namespace QUADKEYTileSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = MercatorTileSource.Props
}

export interface QUADKEYTileSource extends QUADKEYTileSource.Attrs {}

export class QUADKEYTileSource extends MercatorTileSource {
  override properties: QUADKEYTileSource.Props

  constructor(attrs?: Partial<QUADKEYTileSource.Attrs>) {
    super(attrs)
  }

  override get_image_url(x: number, y: number, z: number): string {
    const image_url = this.string_lookup_replace(this.url, this.extra_url_vars)
    const [wx, wy, wz] = this.tms_to_wmts(x, y, z)
    const quadKey = this.tile_xyz_to_quadkey(wx, wy, wz)
    return image_url.replace("{Q}", quadKey)
  }
}
