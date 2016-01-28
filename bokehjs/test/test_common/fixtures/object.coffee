_ = require "underscore"
utils = require "../../utils"
Collection = utils.require "common/collection"
HasProps = utils.require "common/has_props"

class TestObject extends HasProps
  type: 'TestObject'

class TestObjectCollection extends Collection
  model: TestObject
  url: "/"

module.exports =
  Model: TestObject
  Collection: new TestObjectCollection()
