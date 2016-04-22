_ = require "underscore"

{logger} = require "./core/logging"

# add some useful functions to underscore
require("./core/util/underscore").patch()

locations = require("./common/models")

overrides = {}

make_cache = (locations) ->
  result = {}
  for name, spec of locations
    if _.isArray(spec)
      subspec = spec[0]
      suffix = spec[1] ? ""
      for subname, mod of subspec
        modname = subname + suffix
        result[modname] = mod
    else
      result[name] = spec
  return result

_mod_cache = null # XXX: do NOT access directly outside _get_mod_cache()

_get_mod_cache = () ->
  if not _mod_cache?
    _mod_cache = make_cache(locations)
  _mod_cache

Models = (typename) ->
  mod_cache = _get_mod_cache()

  if overrides[typename]
    return overrides[typename]

  mod = mod_cache[typename] # mod == module

  if not mod?
    throw new Error("Module `#{typename}' does not exists. The problem may be two fold. Either
                     a model was requested that's available in an extra bundle, e.g. a widget,
                     or a custom model was requested, but it wasn't registered before first
                     usage.")

  return mod.Model

Models.register = (name, model) -> overrides[name] = model
Models.unregister = (name) -> delete overrides[name]

Models.register_locations = (locations, force=false, errorFn=null) ->
  mod_cache = _get_mod_cache()
  cache = make_cache(locations)

  for own name, module of cache
    if force or not mod_cache.hasOwnProperty(name)
      mod_cache[name] = module
    else
      errorFn?(name)

Models.registered_names = () ->
  Object.keys(_get_mod_cache())

# "index" is a map from the toplevel model IDs rendered by
# embed.coffee, to the view objects for those models.  It doesn't
# contain all views, only those explicitly rendered to an element
# by embed.coffee.
index = {}

module.exports =
  overrides: overrides # for testing only
  index: index
  Models: Models
