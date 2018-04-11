import {TickSpec} from "./ticker"
import {BasicTicker} from "./basic_ticker"
import {LatLon} from "core/enums"
import * as p from "core/properties"
import {wgs84_mercator, clip_mercator, in_bounds} from "core/util/projections"

export namespace MercatorTicker {
  export interface Attrs extends BasicTicker.Attrs {
    dimension: LatLon | null | undefined
  }

  export interface Props extends BasicTicker.Props {}
}

export interface MercatorTicker extends MercatorTicker.Attrs {}

export class MercatorTicker extends BasicTicker {

  properties: MercatorTicker.Props

  constructor(attrs?: Partial<MercatorTicker.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "MercatorTicker"

    this.define({
      dimension: [ p.LatLon ],
    })
  }

  get_ticks_no_defaults(data_low: number, data_high: number, cross_loc: any, desired_n_ticks: number): TickSpec<number> {
    if (this.dimension == null) {
      throw new Error("MercatorTicker.dimension not configured")
    }

    [data_low, data_high] = clip_mercator(data_low, data_high, this.dimension)
    let proj_low: number, proj_high: number, proj_cross_loc: any

    if (this.dimension === "lon") {
      [proj_low,  proj_cross_loc] = wgs84_mercator.inverse([data_low,  cross_loc]);
      [proj_high, proj_cross_loc] = wgs84_mercator.inverse([data_high, cross_loc])
    } else {
      [proj_cross_loc, proj_low ] = wgs84_mercator.inverse([cross_loc, data_low ]);
      [proj_cross_loc, proj_high] = wgs84_mercator.inverse([cross_loc, data_high])
    }

    const proj_ticks = super.get_ticks_no_defaults(proj_low, proj_high, cross_loc, desired_n_ticks)

    const major: number[] = []
    const minor: number[] = []

    if (this.dimension === "lon") {
      for (const tick of proj_ticks.major) {
        if (in_bounds(tick, 'lon')) {
          const [lon] = wgs84_mercator.forward([tick, proj_cross_loc])
          major.push(lon)
        }
      }
      for (const tick of proj_ticks.minor) {
        if (in_bounds(tick, 'lon')) {
          const [lon] = wgs84_mercator.forward([tick, proj_cross_loc])
          minor.push(lon)
        }
      }
    } else {
      for (const tick of proj_ticks.major) {
        if (in_bounds(tick, 'lat')) {
          const [, lat] = wgs84_mercator.forward([proj_cross_loc, tick])
          major.push(lat)
        }
      }
      for (const tick of proj_ticks.minor) {
        if (in_bounds(tick, 'lat')) {
          const [, lat] = wgs84_mercator.forward([proj_cross_loc, tick])
          minor.push(lat)
        }
      }
    }

    return {
      major: major,
      minor: minor,
    }
  }
}

MercatorTicker.initClass()
