import {ColorMapper} from "./color_mapper"

import * as p from "core/properties"
import {findIndex} from "core/util/array"
import {isString} from "core/util/types"

_equals = (a, b) ->
  if a.length != b.length
    return false
  for i in [0...a.length]
    if a[i] != b[i]
      return false
  return true

export class CategoricalColorMapper extends ColorMapper
  type: "CategoricalColorMapper"

  @define {
    factors: [ p.Array     ]
    start:   [ p.Number, 0 ]
    end:     [ p.Number    ]
  }

  _get_values: (data, palette) ->
    values = []

    for d in data

      if isString(d)
        key = @factors.indexOf(d)

      else
        if @start?
          if @end?
            d = d.slice(@start, @end)
          else
            d = d.slice(@start)
        else if @end?
          d = d.slice(0, @end)
        if d.length == 1
          key = @factors.indexOf(d[0])
        else
          key = findIndex(@factors, (x) -> _equals(x, d))

      if key < 0 or key >= palette.length
        color = @nan_color
      else
        color = palette[key]

      values.push(color)
    return values
