HasProperties = require('../../base').HasProperties


class GridMapper extends HasProperties
  initialize: (attrs, options) ->
    super(attrs, options)
    @domain_mapper   = options.domain_mapper
    @codomain_mapper = options.codomain_range

  map_to_target: (x, y) ->
    xprime = @domain_mapper.map_to_target(x)
    yprime = @codomain_mapper.map_to_target(y)
    return [xprime, yprime]

  v_map_to_target: (xs, ys) ->
    xprimes = @domain_mapper.v_map_to_target(xs)
    yprimes = @codomain_mapper.v_map_to_target(ys)
    return [xprimes, yprimes]

  map_from_target: (xprime, yprime) ->
    x = @domain_mapper.map_to_target(xprime)
    y = @codomain_mapper.map_to_target(yprime)
    return [x, y]

  v_map_from_target: (xprimes, yprimes) ->
    xs = @domain_mapper.v_map_to_target(xprimes)
    ys = @codomain_mapper.v_map_to_target(yprimes)
    return [xs, ys]


exports.GridMapper = GridMapper