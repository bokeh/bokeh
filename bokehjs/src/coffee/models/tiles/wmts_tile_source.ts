import {MercatorTileSource} from './mercator_tile_source'

export namespace WMTSTileSource {
  export interface Attrs extends MercatorTileSource.Attrs {}

  export interface Opts extends MercatorTileSource.Opts {}
}

export interface WMTSTileSource extends WMTSTileSource.Attrs {}

export class WMTSTileSource extends MercatorTileSource {

  constructor(attrs?: Partial<WMTSTileSource.Attrs>, opts?: WMTSTileSource.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = 'WMTSTileSource'
  }

  get_image_url(x: number, y: number, z: number): string {
    const image_url = this.string_lookup_replace(this.url, this.extra_url_vars)
    const [wx, wy, wz] = this.tms_to_wmts(x, y, z)
    return image_url.replace("{X}", wx.toString())
                    .replace('{Y}', wy.toString())
                    .replace("{Z}", wz.toString())
  }
}
WMTSTileSource.initClass()
