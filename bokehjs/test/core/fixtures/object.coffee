utils = require "../../utils"
{HasProps} = utils.require "core/has_props"

class TestObject extends HasProps
  type: 'TestObject'

module.exports =
  Model: TestObject
