HasProperties = require('../../base').HasProperties


class LogMapper extends HasProperties
  initialize: (attrs, options) ->
    super(attrs, options)

  map_to_target: (x) ->

  v_map_to_target: (xs) ->
    result = new Float32Array(xs.length)
    return result

  map_from_target: (xprime) ->

  v_map_from_target: (xprimes) ->
    result = new Float32Array(xprimes.length)
    return result


exports.LogMapper = LogMapper