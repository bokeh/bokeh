import * as Model from "../../model"

class GridMapper extends Model

  map_to_target: (x, y) ->
    xprime = @domain_mapper.map_to_target(x)
    yprime = @codomain_mapper.map_to_target(y)
    return [xprime, yprime]

  v_map_to_target: (xs, ys) ->
    xprimes = @domain_mapper.v_map_to_target(xs)
    yprimes = @codomain_mapper.v_map_to_target(ys)
    return [xprimes, yprimes]

  map_from_target: (xprime, yprime) ->
    x = @domain_mapper.map_from_target(xprime)
    y = @codomain_mapper.map_from_target(yprime)
    return [x, y]

  v_map_from_target: (xprimes, yprimes) ->
    xs = @domain_mapper.v_map_from_target(xprimes)
    ys = @codomain_mapper.v_map_from_target(yprimes)
    return [xs, ys]

module.exports =
  Model: GridMapper
