_ = require "underscore"
utils = require "../../utils"
Collection = utils.require "common/collection"
HasProperties = utils.require "common/has_properties"

class TestObject extends HasProperties
  type: 'TestObject'

class TestObjectCollection extends Collection
  model: TestObject
  url: "/"

module.exports =
  Model: TestObject
  Collection: new TestObjectCollection()
