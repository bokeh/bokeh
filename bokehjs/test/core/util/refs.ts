import {expect} from "chai"

import * as refs from "core/util/refs"
import {HasProps} from "core/has_props"

class Foo extends HasProps {}
Foo.prototype.type = "Foo"

describe("refs module", () => {

  describe("create_ref", () => {

    it("should return a correct ref for a standard HasProps", () => {
      const obj = new Foo()
      const ref = refs.create_ref(obj)
      expect(ref.id).to.be.equal(obj.id)
      expect(ref.type).to.be.equal(obj.type)
      expect(ref.subtype).to.be.undefined
      expect(refs.is_ref(ref)).to.be.true
    })

    it("should return a correct ref for a subtype HasProps", () => {
      const obj = new Foo()
      obj._subtype = "bar"
      const ref = refs.create_ref(obj)
      expect(ref.id).to.be.equal(obj.id)
      expect(ref.type).to.be.equal(obj.type)
      expect(ref.subtype).to.be.equal("bar")
      expect(refs.is_ref(ref)).to.be.true
    })
  })

  describe("is_ref", () => {
    it("should return true for {id, type}", () => {
      const obj = {id: 10, type: "foo"}
      expect(refs.is_ref(obj)).to.be.true
    })

    it("should return true for {id, type, subtype}", () => {
      const obj = {id: 10, type: "foo", subtype: "bar"}
      expect(refs.is_ref(obj)).to.be.true
    })

    it("should return false on any other object", () => {
      const obj0 = {}
      expect(refs.is_ref(obj0)).to.be.false

      const obj1 = {id: 10}
      expect(refs.is_ref(obj1)).to.be.false

      const obj2 = {type: "foo"}
      expect(refs.is_ref(obj2)).to.be.false

      const obj3 = {a: 10, type: "foo"}
      expect(refs.is_ref(obj3)).to.be.false

      const obj4 = {id: 10, b: "foo"}
      expect(refs.is_ref(obj4)).to.be.false

      const obj5 = {subtype: "bar"}
      expect(refs.is_ref(obj5)).to.be.false

      const obj6 = {a: 10, b: "foo", c: "bar", d: "baz"}
      expect(refs.is_ref(obj6)).to.be.false
    })
  })
})
