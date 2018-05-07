{expect} = require "chai"
utils = require "../../utils"

object = utils.require "core/util/object"

describe "object module", ->

  it "values should return an array of the values of an object", ->
    obj1 = {'key1': 'val1', 'key2': 'val2'}
    expect(object.values(obj1)).to.deep.equal ['val1', 'val2']

  it "clone should create a new object with the same key/values", ->
    obj1 = {'key1': 'val1', 'key2': 'val2'}
    expect(object.clone(obj1)).to.deep.equal obj1

  it "merge should union the array values of two objects", ->
    obj1 = {'key1': [], 'key2': [0]}
    obj2 = {'key2': [1, 2, 3]}
    expect(object.merge(obj1, obj2)).to.deep.equal {'key1': [], 'key2': [0, 1, 2, 3]}

  it "isEmpty should return true if an object has no keys", ->
    obj1 = {}
    obj2 = {'key1': 1}
    expect(object.isEmpty(obj1)).to.be.true
    expect(object.isEmpty(obj2)).to.be.false

  describe "extend", ->

    it "called with two parameters should add the key/value pairs from second source object to the first dest object", ->
      obj1 = {'key1': [], 'key2': [0]}
      obj3 = {'key3': 5}
      expect(object.extend(obj1, obj3)).to.deep.equal {'key1': [], 'key2': [0], 'key3': 5}

    it "called with 3+ parameters should add key/value pairs from second and later objects to the first dest object", ->
      obj1 = {'key1': [], 'key2': [0]}
      obj2 = {'key2': [1, 2, 3]}
      obj3 = {'key3': 5}
      expect(object.extend(obj1, obj2, obj3)).to.deep.equal {'key1': [], 'key2': [1, 2, 3], 'key3': 5}
