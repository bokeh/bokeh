_ = require "underscore"

Renderer = require "./renderer"
p = require "../../core/properties"

class GuideRenderer extends Renderer.Model
  type: 'GuideRenderer'

  props: ->
    return _.extend {}, super(), {
      level: [ p.RenderLevel, 'overlay' ]
      plot:  [ p.Instance               ]
    }

module.exports =
  Model: GuideRenderer
