import {Ticker, TickSpec} from "./ticker"
import {Range} from "../ranges/range"
import * as p from "core/properties"
import {ScanningColorMapper} from "../mappers/scanning_color_mapper"
import {left_edge_index} from "core/util/arrayable"

export namespace BinnedTicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Ticker.Props & {
    mapper: p.Property<ScanningColorMapper>
    num_major_ticks: p.Property<number | "auto">
  }
}

export interface BinnedTicker extends BinnedTicker.Attrs {}

export class BinnedTicker extends Ticker {
  properties: BinnedTicker.Props

  constructor(attrs?: Partial<BinnedTicker.Attrs>) {
    super(attrs)
  }

  static init_BinnedTicker(): void {
    this.define<BinnedTicker.Props>(({Number, Ref, Or, Auto}) => ({
      mapper: [ Ref(ScanningColorMapper) ],
      num_major_ticks: [ Or(Number, Auto), 8 ],
    }))
  }

  get_ticks(data_low: number, data_high: number, _range: Range, _cross_loc: number): TickSpec<number> {
    const {binning} = this.mapper.metrics
    const k_low = Math.max(0, left_edge_index(data_low, binning))
    const k_high = Math.min(left_edge_index(data_high, binning) + 1, binning.length-1)
    const _major: number[] = []
    for (let k = k_low; k <= k_high; k++) {
      _major.push(binning[k])
    }
    const {num_major_ticks} = this
    const major: number[] = []
    const n = num_major_ticks == "auto" ? _major.length : num_major_ticks
    const step = Math.max(1, Math.floor(_major.length/n))
    for (let i = 0; i < _major.length; i += step) {
      major.push(_major[i])
    }
    return {
      major,
      minor: [],
    }
  }
}
