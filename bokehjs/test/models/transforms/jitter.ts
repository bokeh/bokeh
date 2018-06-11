import {expect} from "chai"
import * as sinon from "sinon"

import {FactorRange} from "models/ranges/factor_range"
import {Jitter} from "models/transforms/jitter"
import * as bokeh_math from "core/util/math"
import {repeat} from "core/util/array"
import {sum} from "core/util/arrayable"

describe("Jitter transform module", () => {

  function generate_jitter() {
    return new Jitter({
      width: 1,
      mean: 0,
      distribution: 'uniform',
    })
  }

  let random_stub: sinon.SinonStub
  let rnorm_stub: sinon.SinonStub

  before(() => {
    random_stub = sinon.stub(bokeh_math, "random", () => 0.5)
    // This menas that rnorm isn't getting tested, which we probably
    // do want to do, but could be a separate test.
    rnorm_stub = sinon.stub(bokeh_math, "rnorm", () => 0)
  })

  after(() => {
    random_stub.restore()
    rnorm_stub.restore()
  })

  describe("Jitter with uniform", () => {
    const transform = generate_jitter()
    transform.distribution = 'uniform'

    it("should average the fixed values", () => {
      const N = 100
      const vals = repeat(5, N)
      const rets = transform.v_compute(vals)

      const thesum = sum(rets)
      const thediff = thesum/N - 5
      // We can set this deterministically because we've stubbed random
      expect(thediff).to.equal(0)
    })

    it("should cache values for identical input lengths", () => {
      const N = 100
      const val1 = repeat(5, N)
      const val2 = repeat(6, N)

      const ret1 = transform.v_compute(val1)

      const ret2 = transform.v_compute(val2)
      expect(ret1).to.deep.equal(ret2)
    })
  })


  describe("Jitter with normal", () => {
    const transform = generate_jitter()
    transform.distribution = 'normal'

    it("should average the fixed values", () => {
      const N = 100
      const vals = repeat(5, N)

      const rets = transform.v_compute(vals)

      const thesum = sum(rets)
      const thediff = (thesum/N) - 5
      // We can set this deterministically because we've stubbed rnorm
      expect(thediff).to.equal(0)
    })

    it("should cache values for identical input lengths", () => {
      const N = 100
      const val1 = repeat(5, N)
      const val2 = repeat(6, N)

      const ret1 = transform.v_compute(val1)

      const ret2 = transform.v_compute(val2)
      expect(ret1).to.deep.equal(ret2)
    })
  })

  describe("Jitter with FactorRange", () => {
    const transform = generate_jitter()
    transform.distribution = 'uniform'
    transform.range = new FactorRange({factors: ["a", "b"]})

    it("should work with a supplied range", () => {

      const N = 100
      const vals =  repeat("b", N)
      const rets = transform.v_compute(vals)

      const thesum = sum(rets)
      const thediff = thesum/N - 1.5 // relies on standard synthetic mapping
      // We can set this deterministically because we've stubbed random
      expect(thediff).to.equal(0)
    })

    it("should cache values for identical input lengths", () => {
      const N = 100
      const val1 =  repeat("a", N)
      const val2 =  repeat("b", N)

      const ret1 = transform.v_compute(val1)

      const ret2 = transform.v_compute(val2)
      expect(ret1).to.deep.equal(ret2)
    })
  })
})
