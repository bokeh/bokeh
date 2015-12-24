_ = require "underscore"
HasParent = require "../../common/has_parent"

class GuideRenderer extends HasParent
  type: 'GuideRenderer'

  defaults: ->
    return _.extend {}, super(), {
      plot: null
      level: "overlay"
    }

module.exports =
  Model: GuideRenderer