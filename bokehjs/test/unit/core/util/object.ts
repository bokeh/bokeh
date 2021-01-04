import {expect} from "assertions"

import * as object from "@bokehjs/core/util/object"

describe("object module", () => {

  it("values should return an array of the values of an object", () => {
    const obj1 = {key1: 'val1', key2: 'val2'}
    expect(object.values(obj1)).to.be.equal(['val1', 'val2'])
  })

  it("clone should create a new object with the same key/values", () => {
    const obj1 = {key1: 'val1', key2: 'val2'}
    expect(object.clone(obj1)).to.be.equal(obj1)
  })

  it("merge should union the array values of two objects", () => {
    const obj1 = {key1: [], key2: [0]}
    const obj2 = {key2: [1, 2, 3]}
    expect(object.merge(obj1, obj2)).to.be.equal({key1: [], key2: [0, 1, 2, 3]})
  })

  it("isEmpty should return true if an object has no keys", () => {
    const obj1 = {}
    const obj2 = {key1: 1}
    expect(object.isEmpty(obj1)).to.be.true
    expect(object.isEmpty(obj2)).to.be.false
  })

  describe("extend", () => {

    it("called with two parameters should add the key/value pairs from second source object to the first dest object", () => {
      const obj1 = {key1: [], key2: [0]}
      const obj2 = {key3: 5}
      expect(object.extend(obj1, obj2)).to.be.equal({key1: [], key2: [0], key3: 5})
    })
  })
})
