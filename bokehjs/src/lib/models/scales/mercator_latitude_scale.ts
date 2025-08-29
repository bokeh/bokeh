import {ContinuousScale} from "./continuous_scale"
import type {LatLon} from "core/enums"
import {wgs84_mercator} from "core/util/projections"
import type * as p from "core/properties"

export namespace MercatorLatitudeScale {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousScale.Props & {
    dimension: p.Property<LatLon | null>
  }
}

export interface MercatorLatitudeScale extends MercatorLatitudeScale.Attrs {}

export class MercatorLatitudeScale extends ContinuousScale {
  declare properties: MercatorLatitudeScale.Props

  constructor(attrs?: Partial<MercatorLatitudeScale.Attrs>) {
    super(attrs)
  }

  get s_compute(): (x: number) => number {
    return (x) => {
        const source_start = this.source_range.start
        const source_end   = this.source_range.end
        const target_start = this.target_range.start
        const target_end   = this.target_range.end

        const screen_range = target_end - target_start

        const [, lat_proj_start] = wgs84_mercator.compute(0, source_start)
        const [, lat_proj_end] = wgs84_mercator.compute(0, source_end)
        const lat_proj_range = lat_proj_end - lat_proj_start

        const [, lat_proj_x] = wgs84_mercator.compute(0, x)

        return target_start + (lat_proj_x-lat_proj_start)/lat_proj_range * screen_range
    }
  }

  get s_invert(): (x: number) => number {
    return (x) => {
        const source_start = this.source_range.start
        const source_end   = this.source_range.end
        const target_start = this.target_range.start
        const target_end   = this.target_range.end

        const screen_range = target_end - target_start

        const [, lat_proj_start] = wgs84_mercator.compute(0, source_start)
        const [, lat_proj_end] = wgs84_mercator.compute(0, source_end)
        const lat_proj_range = lat_proj_end - lat_proj_start

        const lat_proj_x = lat_proj_start + (x-target_start)/screen_range * lat_proj_range

        const [, lat] = wgs84_mercator.invert(0, lat_proj_x)

        return lat
    }
  }
}
