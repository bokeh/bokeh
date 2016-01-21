_ = require "underscore"
Range = require "./range"

class DataRange extends Range.Model
  type: 'DataRange'

  defaults: ->
    return _.extend {}, super(), {
      names: []
      renderers: []
    }

module.exports =
  Model: DataRange
