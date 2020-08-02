import {expect} from "assertions"

import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import {Dodge} from "@bokehjs/models/transforms/dodge"
import {NumberArray} from '@bokehjs/core/types'

describe("Dodge transform module", () => {

  describe("Dodge with uniform", () => {
    const transform = new Dodge({value: -0.5})

    it("should add value to data", () => {
      const vals = [-10, -2.5, 0, 0.2, 0.5, 10]
      const rets = transform.v_compute(vals)
      expect(rets).to.be.equal(new NumberArray([-10.5, -3, -0.5, -0.3, 0, 9.5]))
    })
  })

  describe("Dodge with FactorRange", () => {
    const transform = new Dodge({value: 0.5})
    transform.range = new FactorRange({factors: ["a", "b"]})

    it("should work with a supplied range", () => {
      const vals =  ["a", "b", "a"]
      const rets = transform.v_compute(vals)

      // relies on standard synthetic mapping
      expect(rets).to.be.equal(new NumberArray([1, 2, 1]))
    })
  })
})
