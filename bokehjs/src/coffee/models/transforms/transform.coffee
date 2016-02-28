_ = require "underscore"
Model = require "../../model"

class Transform extends Model

  initialize: (attrs, options) ->
    super(attrs, options)

  defaults: ->
    return _.extend({}, super())

module.exports =
  Model: Transform