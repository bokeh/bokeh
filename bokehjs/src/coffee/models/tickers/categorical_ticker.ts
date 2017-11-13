import {Ticker} from "./ticker"

export class CategoricalTicker extends Ticker<string> {

  get_ticks(start: string, end: string, range: any /*FactorRange*/, _cross_loc: any, _: any) {
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

  private _collect(factors: string[], range: any /*FactorRange*/, start: string, end: string): string[] {
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
