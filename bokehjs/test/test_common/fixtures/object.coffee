_ = require "underscore"
utils = require "../../utils"
Collection = utils.require "common/collection"
Component = utils.require("/models/component").Model

class TestObject extends Component
  type: 'TestObject'

class TestObjectCollection extends Collection
  model: TestObject
  url: "/"

module.exports =
  Model: TestObject
  Collection: new TestObjectCollection()
