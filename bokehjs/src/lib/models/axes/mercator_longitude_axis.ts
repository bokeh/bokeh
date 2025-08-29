import {LinearAxis, LinearAxisView} from "./linear_axis"
import {BasicTickFormatter} from "../formatters/basic_tick_formatter"
import {BasicTicker} from "../tickers/basic_ticker"
import type * as p from "core/properties"

export class MercatorLongitudeAxisView extends LinearAxisView {
  declare model: MercatorLongitudeAxis
}

export namespace MercatorLongitudeAxis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LinearAxis.Props & {


  }
}

export interface MercatorLongitudeAxis extends MercatorLongitudeAxis.Attrs {}

export class MercatorLongitudeAxis extends LinearAxis {
  declare properties: MercatorLongitudeAxis.Props
  declare __view_type__: MercatorLongitudeAxisView

  declare ticker: BasicTicker
  declare formatter: BasicTickFormatter

  constructor(attrs?: Partial<MercatorLongitudeAxis.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = MercatorLongitudeAxisView

    this.override<MercatorLongitudeAxis.Props>({
      ticker:    () => new BasicTicker(),
      formatter: () => new BasicTickFormatter(),
    })
  }
}
