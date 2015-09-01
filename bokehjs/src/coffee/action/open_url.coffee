_ = require "underscore"
Util = require "../util/util"
HasProperties = require "../common/has_properties"

class OpenURL extends HasProperties
  type: 'OpenURL'

  execute: (data_source) ->
    for i in Util.get_indices(data_source)
      url = Util.replace_placeholders(@get("url"), data_source, i)
      window.open(url)
    null

  defaults: ->
    return _.extend {}, super(), {
      url: 'http://'
    }

module.exports =
  Model: OpenURL
