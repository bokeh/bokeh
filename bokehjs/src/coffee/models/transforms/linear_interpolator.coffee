_ = require "underscore"
Transform = require "./transform"
Interpolator = require "./interpolator"

class LinearInterpolator extends Interpolator.Model

  initialize: (attrs, options) ->
    super(attrs, options)

  defaults: ->
    return _.extend({}, super())

  compute: (x) ->
    # Apply the transform to a single value
    data = @get('data')

    tsx = data.get_column(@get('x'))
    tsy = data.get_column(@get('y'))

    list = [];
    for j of tsx
        list.push({'x': tsx[j], 'y': tsy[j]});

    list.sort((a, b) ->
        return ((a.x < b.x) ? -1 : ((a.x == b.x) ? 0 : 1));
    );

    for k in [0..list.length-1]
        tsx[k] = list[k].x;
        tsy[k] = list[k].y;

    ind = _.findIndex(tsx, (num) ->
        return x >= num
    )

    x1 = tsx[ind]
    x2 = tsx[ind+1]
    y1 = tsy[ind]
    y2 = tsy[ind+1]

    ret = y1 + (((x-x1) / (x2-x1)) * (y2-y1))
    return(ret)

  v_compute: (xs) ->
    # Apply the tranform to a vector of values
    result = new Float64Array(xs.length)
    for x, idx in xs
      result[idx] = this.compute(x)
    return result

module.exports =
  Model: LinearInterpolator