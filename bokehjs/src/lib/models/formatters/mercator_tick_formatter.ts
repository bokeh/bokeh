import {BasicTickFormatter, BasicTickFormatterView} from "./basic_tick_formatter"
import {LatLon} from "core/enums"
import * as p from "core/properties"
import {wgs84_mercator} from "core/util/projections"

export class MercatorTickFormatterView extends BasicTickFormatterView {
  model: MercatorTickFormatter

  get dimension(): LatLon {
    return this.model.dimension ?? (this.parent.dimension == 0 ? "lon" : "lat")
  }

  format(ticks: number[]): string[] {
    if (ticks.length == 0)
      return []

    const n = ticks.length
    const proj_ticks = new Array(n)

    const {loc} = this.parent
    if (this.dimension == "lon") {
      for (let i = 0; i < n; i++) {
        const [lon] = wgs84_mercator.invert(ticks[i], loc)
        proj_ticks[i] = lon
      }
    } else {
      for (let i = 0; i < n; i++) {
        const [, lat] = wgs84_mercator.invert(loc, ticks[i])
        proj_ticks[i] = lat
      }
    }

    return super.format(proj_ticks)
  }
}

export namespace MercatorTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BasicTickFormatter.Props & {
    dimension: p.Property<LatLon | null>
  }
}

export interface MercatorTickFormatter extends MercatorTickFormatter.Attrs {}

export class MercatorTickFormatter extends BasicTickFormatter {
  properties: MercatorTickFormatter.Props
  __view_type__: MercatorTickFormatterView

  constructor(attrs?: Partial<MercatorTickFormatter.Attrs>) {
    super(attrs)
  }

  static init_MercatorTickFormatter(): void {
    this.prototype.default_view = MercatorTickFormatterView

    this.define<MercatorTickFormatter.Props>(({Nullable}) => ({
      dimension: [ Nullable(LatLon), null ],
    }))
  }
}
