import {Ticker} from "./ticker"
import {FactorRange, Factor} from "../ranges/factor_range"

export namespace CategoricalTicker {
  export interface Attrs extends Ticker.Attrs {}

  export interface Opts extends Ticker.Opts {}
}

export interface CategoricalTicker extends CategoricalTicker.Attrs {}

export class CategoricalTicker extends Ticker<Factor> {

  constructor(attrs?: Partial<CategoricalTicker.Attrs>, opts?: CategoricalTicker.Opts) {
    super(attrs, opts)
  }

  static initClass(): void {
    this.prototype.type = "CategoricalTicker"
  }

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

  private _collect(factors: Factor[], range: FactorRange, start: number, end: number): Factor[] {
    const result: Factor[] = []

    for (const factor of factors) {
      const coord = range.synthetic(factor)
      if (coord > start && coord < end)
        result.push(factor)
    }

    return result
  }
}

CategoricalTicker.initClass()
