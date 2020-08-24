import {TickSpec} from "./ticker"
import {BasicTicker} from "./basic_ticker"
import {LatLon} from "core/enums"
import * as p from "core/properties"
import {wgs84_mercator, clip_mercator, in_bounds} from "core/util/projections"

export namespace MercatorTicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BasicTicker.Props & {
    dimension: p.Property<LatLon | null | undefined>
  }
}

export interface MercatorTicker extends MercatorTicker.Attrs {}

export class MercatorTicker extends BasicTicker {
  properties: MercatorTicker.Props

  constructor(attrs?: Partial<MercatorTicker.Attrs>) {
    super(attrs)
  }

  static init_MercatorTicker(): void {
    this.define<MercatorTicker.Props>({
      dimension: [ p.LatLon ],
    })
  }

  get_ticks_no_defaults(data_low: number, data_high: number, cross_loc: any, desired_n_ticks: number): TickSpec<number> {
    if (this.dimension == null) {
      throw new Error(`${this}.dimension wasn't configured`)
    }

    [data_low, data_high] = clip_mercator(data_low, data_high, this.dimension)

    if (this.dimension == "lon")
      return this._get_ticks_lon(data_low, data_high, cross_loc, desired_n_ticks)
    else
      return this._get_ticks_lat(data_low, data_high, cross_loc, desired_n_ticks)
  }

  protected _get_ticks_lon(data_low: number, data_high: number, cross_loc: any, desired_n_ticks: number): TickSpec<number> {
    const [proj_low] = wgs84_mercator.invert(data_low, cross_loc)
    const [proj_high, proj_cross_loc] = wgs84_mercator.invert(data_high, cross_loc)

    const proj_ticks = super.get_ticks_no_defaults(proj_low, proj_high, cross_loc, desired_n_ticks)

    const major: number[] = []
    for (const tick of proj_ticks.major) {
      if (in_bounds(tick, "lon")) {
        const [lon] = wgs84_mercator.compute(tick, proj_cross_loc)
        major.push(lon)
      }
    }

    const minor: number[] = []
    for (const tick of proj_ticks.minor) {
      if (in_bounds(tick, "lon")) {
        const [lon] = wgs84_mercator.compute(tick, proj_cross_loc)
        minor.push(lon)
      }
    }

    return {major, minor}
  }

  protected _get_ticks_lat(data_low: number, data_high: number, cross_loc: any, desired_n_ticks: number): TickSpec<number> {
    const [, proj_low] = wgs84_mercator.invert(cross_loc, data_low)
    const [proj_cross_loc, proj_high] = wgs84_mercator.invert(cross_loc, data_high)

    const proj_ticks = super.get_ticks_no_defaults(proj_low, proj_high, cross_loc, desired_n_ticks)

    const major: number[] = []
    for (const tick of proj_ticks.major) {
      if (in_bounds(tick, "lat")) {
        const [, lat] = wgs84_mercator.compute(proj_cross_loc, tick)
        major.push(lat)
      }
    }

    const minor: number[] = []
    for (const tick of proj_ticks.minor) {
      if (in_bounds(tick, "lat")) {
        const [, lat] = wgs84_mercator.compute(proj_cross_loc, tick)
        minor.push(lat)
      }
    }

    return {major, minor}
  }
}
