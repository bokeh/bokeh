/* XXX: partial */
import {MercatorTileSource} from './mercator_tile_source';
import * as p from "core/properties"

export namespace BBoxTileSource {
  export interface Attrs extends MercatorTileSource.Attrs {
    use_latlon: boolean
  }

  export interface Opts extends MercatorTileSource.Opts {}
}

export interface BBoxTileSource extends BBoxTileSource.Attrs {}

export class BBoxTileSource extends MercatorTileSource {

  static initClass() {
    this.prototype.type = 'BBoxTileSource';

    this.define({
      use_latlon: [ p.Bool, false ],
    });
  }

  get_image_url(x, y, z) {
    let xmax, xmin, ymax, ymin;
    const image_url = this.string_lookup_replace(this.url, this.extra_url_vars);

    if (this.use_latlon) {
      [xmin, ymin, xmax, ymax] = this.get_tile_geographic_bounds(x, y, z);
    } else {
      [xmin, ymin, xmax, ymax] = this.get_tile_meter_bounds(x, y, z);
    }

    return image_url.replace("{XMIN}", xmin).replace("{YMIN}", ymin).replace("{XMAX}", xmax).replace("{YMAX}", ymax);
  }
}
BBoxTileSource.initClass();
