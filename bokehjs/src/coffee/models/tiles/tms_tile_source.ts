import {MercatorTileSource} from './mercator_tile_source'

export namespace TMSTileSource {
  export interface Attrs extends MercatorTileSource.Attrs {}

  export interface Props extends MercatorTileSource.Props {}
}

export interface TMSTileSource extends TMSTileSource.Attrs {}

export class TMSTileSource extends MercatorTileSource {

  properties: TMSTileSource.Props

  constructor(attrs?: Partial<TMSTileSource.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'TMSTileSource'
  }

  get_image_url(x: number, y: number, z: number): string {
    const image_url = this.string_lookup_replace(this.url, this.extra_url_vars)
    return image_url.replace("{X}", x.toString())
                    .replace('{Y}', y.toString())
                    .replace("{Z}", z.toString())
  }
}
TMSTileSource.initClass()
