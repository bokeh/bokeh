_ = require "underscore"
HasProperties = require "../../common/has_properties"

class Annotation extends HasProperties
  type: 'Annotation'

  defaults: ->
    return _.extend {}, super(), {
      level: 'overlay'
      plot: null
    }

module.exports =
  Model: Annotation
