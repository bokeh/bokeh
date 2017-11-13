import {Ticker} from "./ticker"

import {isArray} from "core/util/types"

export class CategoricalTicker extends Ticker
  type: 'CategoricalTicker'

  get_ticks: (start, end, range, cross_loc, {desired_n_ticks}) ->
    majors = @_collect(range.factors, range, start, end)
    tops = @_collect(range.tops ? [], range, start, end)
    mids = @_collect(range.mids ? [], range, start, end)

    return {
      major : majors
      tops  : tops
      mids  : mids
      minor : []
    }

  _collect: (factors, range, start, end) ->
    result = []

    for f in factors
      coord = range.synthetic(f)
      if coord > start and coord < end
        result.push(f)

    return result
