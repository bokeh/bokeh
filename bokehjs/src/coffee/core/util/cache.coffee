_ = require "underscore"

class Cache

  constructor: () ->
    @_cache = {}

  has: (key) ->
    _.has(@_cache, key)

  get: (key, default_value) ->
    return @_cache[key] ? default_value

  add: (key, value) ->
    @_cache[key] = value

  clear: (key) ->
    if not key?
      @_cache = {}
    else
      delete @_cache[key]

  size: () ->
    return _.size(@_cache)

module.exports =
  Cache: Cache
