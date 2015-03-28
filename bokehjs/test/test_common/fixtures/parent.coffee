_ = require "underscore"
utils = require "../../utils"
Collection = utils.require "common/collection"
HasParent = utils.require "common/has_parent"

class TestParent extends HasParent
  type: 'TestParent'
  parent_properties: ['testprop']

  display_defaults: ->
    _.extend {}, super(), {
      testprop: 'defaulttestprop'
    }

class TestParentCollection extends Collection
  model: TestParent

module.exports =
  Model: TestParent
  Collection: new TestParentCollection()
