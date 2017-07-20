import {Ticker} from "./ticker"

export class CategoricalTicker extends Ticker
  type: 'CategoricalTicker'

  get_ticks: (start, end, range, cross_loc, {desired_n_ticks}) ->
    majors = []
    coords = range.v_synthetic(range.factors)
    for i in [0...coords.length]
      if coords[i] > start and coords[i] < end
        majors.push(range.factors[i])
    return {
      "major": majors
      "minor": []
    }
