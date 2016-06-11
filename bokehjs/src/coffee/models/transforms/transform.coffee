_ = require "underscore"
Model = require "../../model"

class Transform extends Model

  defaults: ->
    return _.extend({}, super())

module.exports =
  Model: Transform
