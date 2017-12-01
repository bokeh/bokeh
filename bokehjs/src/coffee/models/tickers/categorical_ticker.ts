import {Ticker} from "./ticker"
import {FactorRange} from "../ranges/factor_range"

export class CategoricalTicker extends Ticker<string> {

  get_ticks(start: number, end: number, range: FactorRange, _cross_loc: any, _: any) {
    const majors = this._collect(range.factors, range, start, end)

    const tops = this._collect(range.tops || [], range, start, end)
    const mids = this._collect(range.mids || [], range, start, end)

    return {
      major: majors,
      minor: [],
      tops : tops,
      mids : mids,
    }
  }

  private _collect(factors: string[], range: FactorRange, start: number, end: number): string[] {
    const result = []

    for (const factor of factors) {
      const coord = range.synthetic(factor)
      if (coord > start && coord < end)
        result.push(factor)
    }

    return result
  }
}

CategoricalTicker.prototype.type = "CategoricalTicker"
