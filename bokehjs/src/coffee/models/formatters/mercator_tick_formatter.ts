/* XXX: partial */
import {BasicTickFormatter} from "./basic_tick_formatter";
import * as p from "core/properties";
import {proj4, mercator} from "core/util/proj4"

export class MercatorTickFormatter extends BasicTickFormatter {
  static initClass() {
    this.prototype.type = 'MercatorTickFormatter';

    this.define({
      dimension: [ p.LatLon ],
    });
  }

  doFormat(ticks, axis) {
    if ((this.dimension == null)) {
      throw new Error("MercatorTickFormatter.dimension not configured");
    }

    if (ticks.length === 0) {
      return [];
    }

    const proj_ticks = new Array(ticks.length);

    if (this.dimension === "lon") {
      for (let i = 0, end = ticks.length; i < end; i++) {
        const [lon,] = proj4(mercator).inverse([ticks[i], axis.loc]);
        proj_ticks[i] = lon;
      }
    } else {
      for (let i = 0, end = ticks.length; i < end; i++) {
        const [, lat] = proj4(mercator).inverse([axis.loc, ticks[i]]);
        proj_ticks[i] = lat;
      }
    }

    return super.doFormat(proj_ticks, axis);
  }
}
MercatorTickFormatter.initClass();
