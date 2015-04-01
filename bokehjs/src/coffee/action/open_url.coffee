_ = require "underscore"
Util = require "../util/util"
Collection = require "../common/collection"
HasProperties = require "../common/has_properties"

class OpenURL extends HasProperties
  type: 'OpenURL'

  execute: (data_source) ->
    indices = data_source.get("selected")
    for i in indices
      url = Util.replace_placeholders(@get("url"), data_source, i)
      window.open(url)

  defaults: ->
    return _.extend {}, super(), {
      url: 'http://'
    }

class OpenURLs extends Collection
  model: OpenURL

module.exports =
  Model: OpenURL
  Collection: new OpenURLs()
