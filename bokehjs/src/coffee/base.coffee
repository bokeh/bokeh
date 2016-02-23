_ = require "underscore"
Collection = require "./common/collection"
window = {location: {href: "local"}} unless window?

{logger} = require "./core/logging"

# add some useful functions to underscore
require("./core/util/underscore").patch()

# fixup for PhantomJS deficiency
#
# see https://github.com/ariya/phantomjs/issues/10522#issuecomment-66449127
Function.prototype.bind = Function.prototype.bind || (thisp) ->
  fn = this
  return () -> fn.apply(thisp, arguments)

Config = {}
url = window.location.href
if url.indexOf('/bokeh') > 0
  Config.prefix = url.slice(0, url.lastIndexOf('/bokeh')) + "/" #keep trailing slash
else
  Config.prefix = '/'
console.log('Bokeh: setting prefix to', Config.prefix)

locations = require("./common/models")

collection_overrides = {}

make_collection = (model) ->
  class C extends Collection
    model: model
  return new C()

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

Collections = (typename) ->
  mod_cache = _get_mod_cache()

  if collection_overrides[typename]
    return collection_overrides[typename]

  mod = mod_cache[typename]

  if not mod?
    throw new Error("Module `#{typename}' does not exists. The problem may be two fold. Either
                     a model was requested that's available in an extra bundle, e.g. a widget,
                     or a custom model was requested, but it wasn't registered before first
                     usage.")

  if not mod.Collection?
    mod.Collection = make_collection(mod.Model)

  return mod.Collection

Collections.register = (name, collection) ->
  collection_overrides[name] = collection

Collections.register_locations = (locations, force=false, errorFn=null) ->
  mod_cache = _get_mod_cache()
  cache = make_cache(locations)

  for own name, module of cache
    if force or not mod_cache.hasOwnProperty(name)
      mod_cache[name] = module
    else
      errorFn?(name)

Collections.registered_names = () ->
  Object.keys(_get_mod_cache())

# "index" is a map from the toplevel model IDs rendered by
# embed.coffee, to the view objects for those models.  It doesn't
# contain all views, only those explicitly rendered to an element
# by embed.coffee.
index = {}

module.exports =
  collection_overrides: collection_overrides # for testing only
  locations: locations #
  index: index
  Collections: Collections
  Config: Config
