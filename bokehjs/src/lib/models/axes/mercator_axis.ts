import {AxisView} from "./axis"
import {LinearAxis} from "./linear_axis"
import {MercatorTickFormatter} from "../formatters/mercator_tick_formatter"
import {MercatorTicker} from "../tickers/mercator_ticker"
import * as p from "core/properties"

export class MercatorAxisView extends AxisView {
  model: MercatorAxis
}

export namespace MercatorAxis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LinearAxis.Props & {
    ticker:    p.Property<MercatorTicker>
    formatter: p.Property<MercatorTickFormatter>
  }
}

export interface MercatorAxis extends MercatorAxis.Attrs {}

export class MercatorAxis extends LinearAxis {
  properties: MercatorAxis.Props

  ticker:    MercatorTicker
  formatter: MercatorTickFormatter

  constructor(attrs?: Partial<MercatorAxis.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.default_view = MercatorAxisView

    this.override({
      ticker:    () => new MercatorTicker({dimension: "lat"}),
      formatter: () => new MercatorTickFormatter({dimension: "lat"}),
    })
  }
}
MercatorAxis.initClass()
