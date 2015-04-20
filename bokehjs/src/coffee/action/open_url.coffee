_ = require "underscore"
Util = require "../util/util"
HasProperties = require "../common/has_properties"

class OpenURL extends HasProperties
  type: 'OpenURL'

  execute: (data_source) ->
    selected = data_source.get("selected")
    if selected['0d'].flag
      indices = selected['0d'].indices
    else if selected['1d'].indices.length > 0
      indices = selected['1d'].indices
    else if selected['2d'].indices.length > 0
      indices = selected['2d'].indices
    else
      indices = []

    for i in indices
      url = Util.replace_placeholders(@get("url"), data_source, i)
      window.open(url)

  defaults: ->
    return _.extend {}, super(), {
      url: 'http://'
    }

module.exports =
  Model: OpenURL