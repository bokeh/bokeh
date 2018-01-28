/* XXX: partial */
import {MercatorTileSource} from './mercator_tile_source'

export namespace TMSTileSource {
  export interface Attrs extends MercatorTileSource.Attrs {}

  export interface Opts extends MercatorTileSource.Opts {}
}

export interface TMSTileSource extends TMSTileSource.Attrs {}

export class TMSTileSource extends MercatorTileSource {

  constructor(attrs?: Partial<TMSTileSource.Attrs>, opts?: TMSTileSource.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = 'TMSTileSource';
  }

  get_image_url(x, y, z) {
    const image_url = this.string_lookup_replace(this.url, this.extra_url_vars);
    return image_url.replace("{X}", x).replace('{Y}', y).replace("{Z}", z);
  }
}
TMSTileSource.initClass();
