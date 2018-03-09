import {MercatorTileSource} from './mercator_tile_source'

export namespace QUADKEYTileSource {
  export interface Attrs extends MercatorTileSource.Attrs {}

  export interface Props extends MercatorTileSource.Props {}
}

export interface QUADKEYTileSource extends QUADKEYTileSource.Attrs {}

export class QUADKEYTileSource extends MercatorTileSource {

  properties: QUADKEYTileSource.Props

  constructor(attrs?: Partial<QUADKEYTileSource.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'QUADKEYTileSource'
  }

  get_image_url(x: number, y: number, z: number): string {
    const image_url = this.string_lookup_replace(this.url, this.extra_url_vars)
    const [wx, wy, wz] = this.tms_to_wmts(x, y, z)
    const quadKey = this.tile_xyz_to_quadkey(wx, wy, wz)
    return image_url.replace("{Q}", quadKey)
  }
}
QUADKEYTileSource.initClass()
