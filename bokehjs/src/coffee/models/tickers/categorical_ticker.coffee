import {Ticker} from "./ticker"

import {isArray} from "core/util/types"

export class CategoricalTicker extends Ticker
  type: 'CategoricalTicker'

  get_ticks: (start, end, range, cross_loc, {desired_n_ticks}) ->
    majors = []

    for i in [0...range.factors.length]
      factor = range.factors[i]
      if isArray(factor) and factor.length==2 and factor[1]==null
        continue
      if isArray(factor) and factor.length==3 and factor[2]==null
        continue
      coord = range.synthetic(factor)
      if coord > start and coord < end
        majors.push(range.factors[i])
    return {
      "major": majors
      "minor": []
    }
