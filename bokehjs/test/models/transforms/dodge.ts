import {expect} from "chai"

import {FactorRange} from "models/ranges/factor_range"
import {Dodge} from "models/transforms/dodge"

describe("Dodge transform module", () => {

  describe("Dodge with uniform", () => {
    const transform = new Dodge({value: -0.5})

    it("should add value to data", () => {
      const vals = [-10, -2.5, 0, .2, .5, 10]
      const rets = transform.v_compute(vals)
      expect(rets).to.deep.equal(new Float64Array([-10.5, -3, -0.5, -0.3, 0, 9.5]))
    })
  })

  describe("Dodge with FactorRange", () => {
    const transform = new Dodge({value: 0.5})
    transform.range = new FactorRange({factors: ["a", "b"]})

    it("should work with a supplied range", () => {
      const vals =  ["a", "b", "a"]
      const rets = transform.v_compute(vals)

      // relies on standard synthetic mapping
      expect(rets).to.deep.equal(new Float64Array([1, 2, 1]))
    })
  })
})
