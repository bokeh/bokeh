/* XXX: partial */
import {BasicTickFormatter} from "./basic_tick_formatter";
import {LatLon} from "core/enums"
import * as p from "core/properties";
import {wgs84_mercator} from "core/util/projections"

export namespace MercatorTickFormatter {
  export interface Attrs extends BasicTickFormatter.Attrs {
    dimension: LatLon
  }

  export interface Opts extends BasicTickFormatter.Opts {}
}

export interface MercatorTickFormatter extends MercatorTickFormatter.Attrs {}

export class MercatorTickFormatter extends BasicTickFormatter {

  constructor(attrs?: Partial<MercatorTickFormatter.Attrs>, opts?: MercatorTickFormatter.Opts) {
    super(attrs, opts)
  }

  static initClass(): void {
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
        const [lon,] = wgs84_mercator.inverse([ticks[i], axis.loc]);
        proj_ticks[i] = lon;
      }
    } else {
      for (let i = 0, end = ticks.length; i < end; i++) {
        const [, lat] = wgs84_mercator.inverse([axis.loc, ticks[i]]);
        proj_ticks[i] = lat;
      }
    }

    return super.doFormat(proj_ticks, axis);
  }
}
MercatorTickFormatter.initClass();
