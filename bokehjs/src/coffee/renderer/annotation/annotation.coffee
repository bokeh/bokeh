_ = require "underscore"
HasParent = require "../../common/has_parent"

class Annotation extends HasParent
  type: 'Annotation'

  defaults: ->
    return _.extend {}, super(), {
      level: 'overlay'
      plot: null
    }

module.exports =
  Model: Annotation