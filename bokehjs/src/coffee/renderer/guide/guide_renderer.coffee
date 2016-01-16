_ = require "underscore"
HasProperties = require "../../common/has_properties"

class GuideRenderer extends HasProperties
  type: 'GuideRenderer'

  defaults: ->
    return _.extend {}, super(), {
      plot: null
      level: "overlay"
    }

module.exports =
  Model: GuideRenderer
