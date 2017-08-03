import {Transform} from "./transform"
import * as p from "core/properties"
import * as bokeh_math from "core/util/math"

export class Jitter extends Transform
  @define {
    mean:         [ p.Number      , 0        ]
    width:        [ p.Number      , 1        ]
    distribution: [ p.Distribution, 'uniform']
    range:        [ p.Instance               ]
  }

  compute: (x, use_synthetic=true) ->
    if @range?.synthetic? and use_synthetic
      x = @range.synthetic(x)
    # Apply the transform to a single value
    if @distribution == 'uniform'
      return(x + @mean + ((bokeh_math.random() - 0.5) * @width))

    if @distribution == 'normal'
      return(x + bokeh_math.rnorm(@mean, @width))

  v_compute: (xs) ->
    if @range?.v_synthetic?
      xs = @range.v_synthetic(xs)
    # Apply the tranform to a vector of values
    result = new Float64Array(xs.length)
    for x, idx in xs
      result[idx] = this.compute(x, false)
    return result
