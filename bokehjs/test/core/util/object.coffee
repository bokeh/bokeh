{expect} = require "chai"
utils = require "../../utils"

object = utils.require "core/util/object"

describe "object module", ->

  it "merge should union the array values of two objects", ->
    obj1 = {'key1': [], 'key2': [0]}
    obj2 = {'key2': [1, 2, 3]}
    expect(object.merge(obj1, obj2)).to.deep.equal {'key1': [], 'key2': [0, 1, 2, 3]}
