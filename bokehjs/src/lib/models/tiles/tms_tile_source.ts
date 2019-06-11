import {MercatorTileSource} from './mercator_tile_source'
import * as p from "core/properties"

export namespace TMSTileSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = MercatorTileSource.Props
}

export interface TMSTileSource extends TMSTileSource.Attrs {}

export class TMSTileSource extends MercatorTileSource {
  properties: TMSTileSource.Props

  constructor(attrs?: Partial<TMSTileSource.Attrs>) {
    super(attrs)
  }

  get_image_url(x: number, y: number, z: number): string {
    const image_url = this.string_lookup_replace(this.url, this.extra_url_vars)
    return image_url.replace("{X}", x.toString())
                    .replace('{Y}', y.toString())
                    .replace("{Z}", z.toString())
  }
}
