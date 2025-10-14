import {ContinuousAxis, ContinuousAxisView} from "./continuous_axis"
import {BasicTickFormatter} from "../formatters/basic_tick_formatter"
import {BasicTicker} from "../tickers/basic_ticker"
import type * as p from "core/properties"
import {wgs84_mercator} from "core/util/projections"

export class MercatorLatitudeAxisView extends ContinuousAxisView {
  declare model: MercatorLatitudeAxis

  protected override _hit_value(sx: number, sy: number): number | null {
    console.log("HIT VALUE")
    const [range] = this.ranges
    const {start, end} = range

    const [, lat_proj_start] = wgs84_mercator.compute(0, start)
    const [, lat_proj_end] = wgs84_mercator.compute(0, end)
    const lat_proj_range = lat_proj_end - lat_proj_start

    switch (this.dimension) {
      case 0: {
        const {x0, width} = this.bbox
        const lat_proj_x = lat_proj_range * (sx - x0) / width + lat_proj_start
        const [, lat] = wgs84_mercator.invert(0, lat_proj_x)
        return lat
      }
      case 1: {
        const {y0, height} = this.bbox
        const lat_proj_y = lat_proj_end - lat_proj_range * (sy - y0) / height
        const [, lat] = wgs84_mercator.invert(0, lat_proj_y)
        return lat
      }
    }
  }
}

export namespace MercatorLatitudeAxis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousAxis.Props
}

export interface MercatorLatitudeAxis extends MercatorLatitudeAxis.Attrs {}

export class MercatorLatitudeAxis extends ContinuousAxis {
  declare properties: MercatorLatitudeAxis.Props
  declare __view_type__: MercatorLatitudeAxisView

  declare ticker: BasicTicker
  declare formatter: BasicTickFormatter

  constructor(attrs?: Partial<MercatorLatitudeAxis.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = MercatorLatitudeAxisView

    this.override<MercatorLatitudeAxis.Props>({
      ticker:    () => new BasicTicker(),
      formatter: () => new BasicTickFormatter(),
    })
  }
}
