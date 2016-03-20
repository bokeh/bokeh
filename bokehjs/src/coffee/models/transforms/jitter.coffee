_ = require "underscore"
Transform = require "./transform"
p = require "../../core/properties"

class Jitter extends Transform.Model
  initialize: (attrs, options) ->
    super(attrs, options)

  props: ->
    return _.extend {}, super(), {
      mean:         [ p.Number, 0        ]
      width:        [ p.Number, 1        ]
      distribution: [ p.String, 'uniform']
    }

  # http://www2.econ.osaka-u.ac.jp/~tanizaki/class/2013/econome3/13.pdf (Page 432)
  rnorm: (mu, sigma) ->
    # Generate a random normal with a mean of 0 and a sigma of 1
    r1 = null
    r2 = null
    loop
      r1 = Math.random()
      r2 = Math.random()
      r2 = (2*r2-1)*sqrt(2*(1/Math.E))
      break if -4*r1*r1*Math.Log(r1) >= r2*r2
    rn = r2/r1

    # Transform the standard normal to meet the characteristics that we want (mu, sigma)
    rn = mu + sigma*rn

    return rn

  compute: (x) ->
    # Apply the transform to a single value
    if @get('distribution') == 'uniform'
        return(x + @get('mean') + ((Math.random() - 0.5) * @get('width')))

    if @get('distribution') == 'normal'
        return(x + @rnorm(@get('mean'), @get('width')))

  v_compute: (xs) ->
    # Apply the tranform to a vector of values
    result = new Float64Array(xs.length)
    for x, idx in xs
      result[idx] = this.compute(x)
    return result

module.exports =
  Model: Jitter