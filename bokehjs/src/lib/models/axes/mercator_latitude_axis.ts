import {ContinuousAxis, ContinuousAxisView} from "./continuous_axis"
import {BasicTickFormatter} from "../formatters/basic_tick_formatter"
import {BasicTicker} from "../tickers/basic_ticker"
import type * as p from "core/properties"

export class MercatorLatitudeAxisView extends ContinuousAxisView {
  declare model: MercatorLatitudeAxis

  protected override _hit_value(sx: number, sy: number): number | null {
    // TODO fix adjust hit value to scale
    const [range] = this.ranges
    const {start, end} = range
    const {log10} = Math
    switch (this.dimension) {
      case 0: {
        const {x0, width} = this.bbox
        return log10(end/start) * (sx - x0) / width + log10(start)
      }
      case 1: {
        const {y0, height} = this.bbox
        return log10(end) - log10(end/start) * (sy - y0) / height
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
