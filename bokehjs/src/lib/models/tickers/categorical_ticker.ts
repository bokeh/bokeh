import type {TickSpec} from "./ticker"
import {Ticker} from "./ticker"
import type {FactorRange, Factor} from "../ranges/factor_range"
import type * as p from "core/properties"

export type FactorTickSpec = TickSpec<Factor> & {
  tops: Factor[]
  mids: Factor[]
}

export namespace CategoricalTicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Ticker.Props
}

export interface CategoricalTicker extends CategoricalTicker.Attrs {}

export class CategoricalTicker extends Ticker {
  declare properties: CategoricalTicker.Props

  constructor(attrs?: Partial<CategoricalTicker.Attrs>) {
    super(attrs)
  }

  get_ticks(start: number, end: number, range: FactorRange, _cross_loc: number): FactorTickSpec {
    const majors = this._collect(range.factors, range, start, end)

    const tops = this._collect(range.mapper.tops ?? [], range, start, end)
    const mids = this._collect(range.mapper.mids ?? [], range, start, end)

    return {major: majors, minor: [], tops, mids}
  }

  private _collect(factors: Factor[], range: FactorRange, start: number, end: number): Factor[] {
    const result: Factor[] = []

    for (const factor of factors) {
      const coord = range.synthetic(factor)
      if (coord > start && coord < end) {
        result.push(factor)
      }
    }

    return result
  }
}
