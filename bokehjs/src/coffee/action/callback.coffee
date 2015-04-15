_ = require "underscore"
HasProperties = require "../common/has_properties"

class Callback extends HasProperties
  type: 'Callback'

  execute: (value) ->
    args = @get("args")
    names = _.keys(args)
    vals = _.values(args)
    values = _.map(vals, (k) => @resolve_ref(k))
    func = new Function names..., "value", @get("body")
    func(values..., value)

  defaults: ->
    return _.extend {}, super(), {
      args: {}
      body: ""
    }

module.exports =
  Model: Callback