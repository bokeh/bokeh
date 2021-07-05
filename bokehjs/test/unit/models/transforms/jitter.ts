import {expect} from "assertions"
import * as sinon from "sinon"

import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import {Jitter} from "@bokehjs/models/transforms/jitter"
import * as bokeh_math from "@bokehjs/core/util/math"
import {repeat} from "@bokehjs/core/util/array"
import {sum} from "@bokehjs/core/util/arrayable"
import {infer_type} from "@bokehjs/core/types"

describe("Jitter transform module", () => {

  function generate_jitter() {
    return new Jitter({
      width: 1,
      mean: 0,
      distribution: "uniform",
    })
  }

  let random_stub: sinon.SinonStub
  let rnorm_stub: sinon.SinonStub

  before_each(() => {
    random_stub = sinon.stub(bokeh_math, "random").callsFake(() => 0.5)
    // This menas that rnorm isn't getting tested, which we probably
    // do want to do, but could be a separate test.
    rnorm_stub = sinon.stub(bokeh_math, "rnorm").callsFake(() => 0)
  })

  after_each(() => {
    random_stub.restore()
    rnorm_stub.restore()
  })

  describe("Jitter with uniform", () => {
    const transform = generate_jitter()
    transform.distribution = "uniform"

    it("should average the fixed values", () => {
      const N = 100
      const vals = repeat(5, N)
      const rets = transform.v_compute(vals)

      const thesum = sum(rets)
      const thediff = thesum/N - 5
      // We can set this deterministically because we've stubbed random
      expect(thediff).to.be.equal(0)
    })

    it("should cache offsets for identical input lengths", () => {
      const N = 100
      const val1 = repeat(5, N)
      const val2 = repeat(6, N)

      const ret1 = transform.v_compute(val1)
      const diff1 = new (infer_type(ret1))(ret1.length)
      for (let i = 0; i < ret1.length; i++) {
        diff1[i] = ret1[i] - 5
      }

      const ret2 = transform.v_compute(val2)
      const diff2 = new (infer_type(ret2))(ret2.length)
      for (let i = 0; i < ret1.length; i++) {
        diff2[i] = ret2[i] - 6
      }
      expect(diff1).to.be.equal(diff2)
    })
  })

  describe("Jitter with normal", () => {
    const transform = generate_jitter()
    transform.distribution = "normal"

    it("should average the fixed values", () => {
      const N = 100
      const vals = repeat(5, N)

      const rets = transform.v_compute(vals)

      const thesum = sum(rets)
      const thediff = (thesum/N) - 5
      // We can set this deterministically because we've stubbed rnorm
      expect(thediff).to.be.equal(0)
    })

    it("should cache offsets for identical input lengths", () => {
      const N = 100
      const val1 = repeat(5, N)
      const val2 = repeat(6, N)

      const ret1 = transform.v_compute(val1)
      const diff1 = new (infer_type(ret1))(ret1.length)
      for (let i = 0; i < ret1.length; i++) {
        diff1[i] = ret1[i] - 5
      }

      const ret2 = transform.v_compute(val2)
      const diff2 = new (infer_type(ret2))(ret2.length)
      for (let i = 0; i < ret1.length; i++) {
        diff2[i] = ret2[i] - 6
      }
      expect(diff1).to.be.equal(diff2)
    })
  })

  describe("Jitter with FactorRange", () => {
    const transform = generate_jitter()
    transform.distribution = "uniform"
    transform.range = new FactorRange({factors: ["a", "b"]})

    it("should work with a supplied range", () => {

      const N = 100
      const vals =  repeat("b", N)
      const rets = transform.v_compute(vals)

      const thesum = sum(rets)
      const thediff = thesum/N - 1.5 // relies on standard synthetic mapping
      // We can set this deterministically because we've stubbed random
      expect(thediff).to.be.equal(0)
    })

    it("should cache offsets for identical input lengths", () => {
      const N = 100
      const val1 =  repeat("a", N)
      const val2 =  repeat("b", N)

      const ret1 = transform.v_compute(val1)
      const ret1mean = sum(ret1)/N
      const diff1 = new (infer_type(ret1))(ret1.length)
      for (let i = 0; i < ret1.length; i++) {
        diff1[i] = ret1[i] - ret1mean
      }

      const ret2 = transform.v_compute(val2)
      const ret2mean = sum(ret2)/N
      const diff2 = new (infer_type(ret2))(ret2.length)
      for (let i = 0; i < ret1.length; i++) {
        diff2[i] = ret2[i] - ret2mean
      }
      expect(diff1).to.be.equal(diff2)
    })
  })
})
