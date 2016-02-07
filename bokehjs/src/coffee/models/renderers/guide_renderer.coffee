_ = require "underscore"
Renderer = require "./renderer"

class GuideRenderer extends Renderer.Model
  type: 'GuideRenderer'

  defaults: ->
    return _.extend {}, super(), {
      plot: null
      level: "overlay"
    }

module.exports =
  Model: GuideRenderer
