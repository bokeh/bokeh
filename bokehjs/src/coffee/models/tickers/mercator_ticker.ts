import {BasicTicker} from "./basic_ticker"
import * as p from "core/properties"
import {proj4, mercator, clip_mercator, in_bounds} from "core/util/proj4"

export class MercatorTicker extends BasicTicker {

  get_ticks_no_defaults(data_low, data_high, cross_loc, desired_n_ticks) {
    if (this.dimension == null)
      throw new Error("MercatorTicker.dimension not configured")

    const [data_low, data_high] = clip_mercator(data_low, data_high, this.dimension)
    let proj_low, proj_high, proj_cross_loc

    if (this.dimension === "lon") {
      [proj_low,  proj_cross_loc] = proj4(mercator).inverse([data_low,  cross_loc])
      [proj_high, proj_cross_loc] = proj4(mercator).inverse([data_high, cross_loc])
    } else {
      [proj_cross_loc, proj_low ] = proj4(mercator).inverse([cross_loc, data_low ])
      [proj_cross_loc, proj_high] = proj4(mercator).inverse([cross_loc, data_high])
    }

    const proj_ticks = super.get_ticks_no_defaults(proj_low, proj_high, cross_loc, desired_n_ticks)

    const major = []
    const minor = []

    if (this.dimension === "lon") {
      for (const tick of proj_ticks.major) {
        if (in_bounds(tick, 'lon')) {
          const [lon, _] = proj4(mercator).forward([tick, proj_cross_loc])
          ticks.major.push(lon)
        }
      }
      for (const tick of proj_ticks.minor) {
        if (in_bounds(tick, 'lon')) {
          const [lon, _] = proj4(mercator).forward([tick, proj_cross_loc])
          ticks.minor.push(lon)
        }
      }
    } else {
      for (const tick of proj_ticks.major) {
        if (in_bounds(tick, 'lat')) {
          const [_, lat] = proj4(mercator).forward([proj_cross_loc, tick])
          ticks.major.push(lat)
        }
      }
      for (const tick of proj_ticks.minor) {
        if (in_bounds(tick, 'lat')) {
          const [_, lat] = proj4(mercator).forward([proj_cross_loc, tick])
          ticks.minor.push(lat)
        }
      }
    }

    return {
      major: major,
      minor: minor,
    }
  }
}

MercatorTicker.prototype.type = "MercatorTicker"

MercatorTicker.define({
  dimension: [ p.LatLon ],
})
