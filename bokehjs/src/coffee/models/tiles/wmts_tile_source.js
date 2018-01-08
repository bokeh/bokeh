/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {MercatorTileSource} from './mercator_tile_source'
;

export class WMTSTileSource extends MercatorTileSource {
  static initClass() {
    this.prototype.type = 'WMTSTileSource';
  }

  get_image_url(x, y, z) {
    const image_url = this.string_lookup_replace(this.url, this.extra_url_vars);
    [x, y, z] = Array.from(this.tms_to_wmts(x, y, z));
    return image_url.replace("{X}", x).replace('{Y}', y).replace("{Z}", z);
  }
}
WMTSTileSource.initClass();
