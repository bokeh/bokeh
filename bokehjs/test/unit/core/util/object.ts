import {expect} from "assertions"

import * as object from "@bokehjs/core/util/object"
import type {PlainObject} from "@bokehjs/core/types"

describe("object module", () => {

  it("values should return an array of the values of an object", () => {
    const obj1 = {key1: "val1", key2: "val2"}
    expect(object.values(obj1)).to.be.equal(["val1", "val2"])
  })

  it("clone should create a new object with the same key/values", () => {
    const obj1 = {key1: "val1", key2: "val2"}
    expect(object.clone(obj1)).to.be.equal(obj1)
  })

  it("merge should union the array values of two maps", () => {
    const obj1 = new Map([["key1", []], ["key2", [0]]])
    const obj2 = new Map([["key2", [1, 2, 3]]])
    expect(object.merge(obj1, obj2)).to.be.equal(new Map([["key1", []], ["key2", [0, 1, 2, 3]]]))
  })

  it("is_empty should return true if an object has no keys", () => {
    const obj1 = {}
    const obj2 = {key1: 1}
    expect(object.is_empty(obj1)).to.be.true
    expect(object.is_empty(obj2)).to.be.false
  })

  describe("extend", () => {

    it("called with two parameters should add the key/value pairs from second source object to the first dest object", () => {
      const obj1 = {key1: [], key2: [0]}
      const obj2 = {key3: 5}
      expect(object.extend(obj1, obj2)).to.be.equal({key1: [], key2: [0], key3: 5})
    })
  })
})

describe("PlainObjectProxy", () => {
  it("supports clear() method", () => {
    const obj: PlainObject = {x: 1, y: 2, z: 3}
    const dict = new object.PlainObjectProxy(obj)
    dict.clear()
    expect(obj).to.be.equal({})
  })

  it("supports delete() method", () => {
    const obj: PlainObject = {x: 1, y: 2, z: 3}
    const dict = new object.PlainObjectProxy(obj)
    expect(dict.delete("y")).to.be.true
    expect(obj).to.be.equal({x: 1, z: 3})
    expect(dict.delete("x")).to.be.true
    expect(obj).to.be.equal({z: 3})
    expect(dict.delete("z")).to.be.true
    expect(obj).to.be.equal({})
    expect(dict.delete("x")).to.be.false
    expect(dict.delete("t")).to.be.false
  })

  it("supports has() method", () => {
    const obj: PlainObject = {x: 1, y: 2, z: 3}
    const dict = new object.PlainObjectProxy(obj)
    expect(dict.has("x")).to.be.true
    expect(dict.has("y")).to.be.true
    expect(dict.has("z")).to.be.true
    expect(dict.has("t")).to.be.false
    expect(dict.has("toString")).to.be.false
    expect(obj).to.be.equal({x: 1, y: 2, z: 3})
  })

  it("supports get() method", () => {
    const obj: PlainObject = {x: 1, y: 2, z: 3}
    const dict = new object.PlainObjectProxy(obj)
    expect(dict.get("x")).to.be.equal(1)
    expect(dict.get("y")).to.be.equal(2)
    expect(dict.get("z")).to.be.equal(3)
    expect(dict.get("t")).to.be.undefined
    expect(dict.get("toString")).to.be.undefined
    expect(obj).to.be.equal({x: 1, y: 2, z: 3})
  })

  it("supports set() method", () => {
    const obj: PlainObject = {x: 1, y: 2, z: 3}
    const dict = new object.PlainObjectProxy(obj)
    dict.set("x", 10)
    expect(obj).to.be.equal({x: 10, y: 2, z: 3})
    dict.set("y", 20)
    expect(obj).to.be.equal({x: 10, y: 20, z: 3})
    dict.set("z", 30)
    expect(obj).to.be.equal({x: 10, y: 20, z: 30})
    dict.set("t", 40)
    expect(obj).to.be.equal({x: 10, y: 20, z: 30, t: 40})
  })

  it("supports size getter", () => {
    expect(new object.PlainObjectProxy({}).size).to.be.equal(0)
    expect(new object.PlainObjectProxy({x: 1, y: 2, z: 3}).size).to.be.equal(3)
  })

  it("supports default iterator", () => {
    const obj: PlainObject = {x: 1, y: 2, z: 3}
    const dict = new object.PlainObjectProxy(obj)
    const iter = dict[Symbol.iterator]()
    expect([...iter]).to.be.equal([["x", 1], ["y", 2], ["z", 3]])
    expect(obj).to.be.equal({x: 1, y: 2, z: 3})
  })

  it("supports keys() iterator", () => {
    const obj: PlainObject = {x: 1, y: 2, z: 3}
    const dict = new object.PlainObjectProxy(obj)
    const iter = dict.keys()
    expect([...iter]).to.be.equal(["x", "y", "z"])
    expect(obj).to.be.equal({x: 1, y: 2, z: 3})
  })

  it("supports values() iterator", () => {
    const obj: PlainObject = {x: 1, y: 2, z: 3}
    const dict = new object.PlainObjectProxy(obj)
    const iter = dict.values()
    expect([...iter]).to.be.equal([1, 2, 3])
    expect(obj).to.be.equal({x: 1, y: 2, z: 3})
  })

  it("supports entries() iterator", () => {
    const obj: PlainObject = {x: 1, y: 2, z: 3}
    const dict = new object.PlainObjectProxy(obj)
    const iter = dict.entries()
    expect([...iter]).to.be.equal([["x", 1], ["y", 2], ["z", 3]])
    expect(obj).to.be.equal({x: 1, y: 2, z: 3})
  })

  it("supports forEach() method", () => {
    const obj: PlainObject = {x: 1, y: 2, z: 3}
    const dict = new object.PlainObjectProxy(obj)
    const collected: [unknown, string][] = []
    dict.forEach((value, key) => collected.push([value, key]))
    expect(collected).to.be.equal([[1, "x"], [2, "y"], [3, "z"]])
    expect(obj).to.be.equal({x: 1, y: 2, z: 3})
  })
})
