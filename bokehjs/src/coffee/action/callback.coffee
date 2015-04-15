_ = require "underscore"
HasProperties = require "../common/has_properties"

class Callback extends HasProperties
  type: 'Callback'

  execute: (value) ->
    args = @get('args')
    closure = """
    return function(value) {
        #{@get('body')}
    };
    """
    func = Function.apply(null, _.keys(args).concat(closure))
    cb = func.apply(null, _.map(_.values(args), @resolve_ref))
    cb(value)

  defaults: ->
    return _.extend {}, super(), {
      args: {}
      body: ""
    }

module.exports =
  Model: Callback