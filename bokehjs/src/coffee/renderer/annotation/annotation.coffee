_ = require "underscore"
Model = require "../../common/model"

class Annotation extends Model
  type: 'Annotation'

  defaults: ->
    return _.extend {}, super(), {
      level: 'overlay'
      plot: null
    }

module.exports =
  Model: Annotation
