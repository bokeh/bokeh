_ = require "underscore"

Renderer = require "./renderer"
p = require "../../core/properties"

class GuideRenderer extends Renderer.Model
  type: 'GuideRenderer'

  @define {
      plot:  [ p.Instance               ]
    }

  @override {
    level: 'overlay'
  }

module.exports =
  Model: GuideRenderer
