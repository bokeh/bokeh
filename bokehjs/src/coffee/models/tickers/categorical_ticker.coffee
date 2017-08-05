import {Ticker} from "./ticker"

export class CategoricalTicker extends Ticker
  type: 'CategoricalTicker'

  get_ticks: (start, end, range, cross_loc, {desired_n_ticks}) ->
    majors = []
    factors = range.factors
    for i in [0...factors.length]
      ii = i + range.offset
      if (ii+1) > start and (ii+1) < end
        majors.push(factors[i])
    return {
      "major": majors
      "minor": []
    }
