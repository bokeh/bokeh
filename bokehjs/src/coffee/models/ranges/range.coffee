_ = require "underscore"

Model = require "../../model"
p = require "../../core/properties"

class Range extends Model
  type: 'Range'

  props: ->
    return _.extend {}, super(), {
      callback: [ p.Instance ]
    }

  reset: () ->

module.exports =
  Model: Range
