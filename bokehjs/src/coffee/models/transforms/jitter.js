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
    if @distribution == 'uniform'
      return(x + @mean + ((bokeh_math.random() - 0.5) * @width))

    if @distribution == 'normal'
      return(x + bokeh_math.rnorm(@mean, @width))
