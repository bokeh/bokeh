/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS202: Simplify dynamic range loops
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {BasicTickFormatter} from "./basic_tick_formatter";
import * as p from "core/properties";
import {proj4, mercator} from "core/util/proj4"
;

export class MercatorTickFormatter extends BasicTickFormatter {
  static initClass() {
    this.prototype.type = 'MercatorTickFormatter';

    this.define({
      dimension: [ p.LatLon ]
    });
  }

  doFormat(ticks, axis) {
    let i, lat, lon;
    if ((this.dimension == null)) {
      throw new Error("MercatorTickFormatter.dimension not configured");
    }

    if (ticks.length === 0) {
      return [];
    }

    const proj_ticks = new Array(ticks.length);

    if (this.dimension === "lon") {
      let asc, end;
      for (i = 0, end = ticks.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
        [lon, lat] = proj4(mercator).inverse([ticks[i], axis.loc]);
        proj_ticks[i] = lon;
      }
    } else {
      let asc1, end1;
      for (i = 0, end1 = ticks.length, asc1 = 0 <= end1; asc1 ? i < end1 : i > end1; asc1 ? i++ : i--) {
        [lon, lat] = proj4(mercator).inverse([axis.loc, ticks[i]]);
        proj_ticks[i] = lat;
      }
    }

    return super.doFormat(proj_ticks, axis);
  }
}
MercatorTickFormatter.initClass();
