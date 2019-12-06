import {expect} from "chai"

import * as refs from "@bokehjs/core/util/refs"

describe("refs module", () => {

  describe("is_ptr", () => {
    it("should return true for {id}", () => {
      const obj = {id: 10}
      expect(refs.is_ptr(obj)).to.be.true
    })

    it("should return false on any other object", () => {
      const obj0 = {id: 10, type: "foo"}
      expect(refs.is_ptr(obj0)).to.be.false

      const obj1 = {id: 10, type: "foo", subtype: "bar"}
      expect(refs.is_ptr(obj1)).to.be.false

      const obj2 = {}
      expect(refs.is_ptr(obj2)).to.be.false

      const obj3 = {type: "foo"}
      expect(refs.is_ptr(obj3)).to.be.false

      const obj4 = {a: 10, type: "foo"}
      expect(refs.is_ptr(obj4)).to.be.false

      const obj5 = {id: 10, b: "foo"}
      expect(refs.is_ptr(obj5)).to.be.false

      const obj6 = {subtype: "bar"}
      expect(refs.is_ptr(obj6)).to.be.false

      const obj7 = {a: 10, b: "foo", c: "bar", d: "baz"}
      expect(refs.is_ptr(obj7)).to.be.false
    })
  })
})
