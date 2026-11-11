import {expect} from "#framework/assertions"

import {AssertionError, assert_not_null} from "@bokehjs/core/util/assert"

describe("core/util/assert module", () => {

  describe("assert_not_null() function", () => {
    it("should accept values that are neither null nor undefined", () => {
      for (const value of [0, NaN, "", false, [], {}]) {
        expect(() => assert_not_null(value)).to.not.throw()
      }
    })

    it("should throw for null and undefined", () => {
      expect(() => assert_not_null(null)).to.throw(AssertionError, "Assertion failed: expected a non-nullable value")
      expect(() => assert_not_null(undefined)).to.throw(AssertionError, "Assertion failed: expected a non-nullable value")
    })

    it("should support custom messages", () => {
      expect(() => assert_not_null(null, "no canvas")).to.throw(AssertionError, "no canvas")
    })
  })
})
