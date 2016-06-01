_ = require "underscore"
Transform = require "./transform"
p = require "../../core/properties"
bokeh_math = require "../../core/util/math"

class Jitter extends Transform.Model
  @define {
    mean:         [ p.Number      , 0        ]
    width:        [ p.Number      , 1        ]
    distribution: [ p.Distribution, 'uniform']
    }

  compute: (x) ->
    # Apply the transform to a single value
    if @get('distribution') == 'uniform'
      return(x + @get('mean') + ((bokeh_math.random() - 0.5) * @get('width')))

    if @get('distribution') == 'normal'
      return(x + bokeh_math.rnorm(@get('mean'), @get('width')))

  v_compute: (xs) ->
    # Apply the tranform to a vector of values
    result = new Float64Array(xs.length)
    for x, idx in xs
      result[idx] = this.compute(x)
    return result

module.exports =
  Model: Jitter
