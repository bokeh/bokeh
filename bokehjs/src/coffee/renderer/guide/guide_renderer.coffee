_ = require "underscore"
Model = require "../../models/model"

class GuideRenderer extends Model
  type: 'GuideRenderer'

  defaults: ->
    return _.extend {}, super(), {
      plot: null
      level: "overlay"
    }

module.exports =
  Model: GuideRenderer
