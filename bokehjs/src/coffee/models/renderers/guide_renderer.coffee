_ = require "underscore"

Renderer = require "./renderer"
p = require "../../core/properties"

class GuideRenderer extends Renderer.Model
  type: 'GuideRenderer'

  @define {
      level: [ p.RenderLevel, 'overlay' ]
      plot:  [ p.Instance               ]
    }

module.exports =
  Model: GuideRenderer
