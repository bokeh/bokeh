import {expect} from "assertions"

import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import {Jitter} from "@bokehjs/models/transforms/jitter"
import {repeat} from "@bokehjs/core/util/array"
import {sum} from "@bokehjs/core/util/arrayable"
import {infer_type} from "@bokehjs/core/types"
import {AbstractRandom, MAX_INT32} from "@bokehjs/core/util/random"
import {RandomGenerator} from "@bokehjs/models/random/random_generator"

// This is based on the original sinon-based tests.
class FakeGenerator extends RandomGenerator {
  generator() {
    return new class extends AbstractRandom {
      integer(): number {
        return (MAX_INT32 - 1)/2 + 1 // float() returns 0.5
      }

      override normals(_loc: number, _scale: number, size: number): Float64Array {
        return Float64Array.from({length: size}, () => 0)
      }
    }
  }
}

describe("Jitter transform module", () => {
  const N = 100

  function generate_jitter(attrs?: Partial<Jitter.Attrs>) {
    return new Jitter({
      width: 1,
      mean: 0,
      distribution: "uniform",
      random_generator: new FakeGenerator(),
      ...attrs,
    })
  }

  describe("Jitter with uniform", () => {

    it("should average the fixed values", () => {
      const transform = generate_jitter({distribution: "uniform"})

      const vals = repeat(5, N)
      const rets = transform.v_compute(vals)

      const thesum = sum(rets)
      const thediff = thesum/N - 5
      // We can set this deterministically because we've stubbed random
      expect(thediff).to.be.equal(0)
    })

    it("should cache offsets for identical input lengths", () => {
      const transform = generate_jitter({distribution: "uniform"})

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

    it("should average the fixed values", () => {
      const transform = generate_jitter({distribution: "normal"})

      const vals = repeat(5, N)

      const rets = transform.v_compute(vals)

      const thesum = sum(rets)
      const thediff = (thesum/N) - 5
      // We can set this deterministically because we've stubbed rnorm
      expect(thediff).to.be.equal(0)
    })

    it("should cache offsets for identical input lengths", () => {
      const transform = generate_jitter({distribution: "normal"})

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

    it("should work with a supplied range", () => {
      const transform = generate_jitter({
        distribution: "uniform",
        range: new FactorRange({factors: ["a", "b"]}),
      })

      const vals = repeat("b", N)
      const rets = transform.v_compute(vals)

      const thesum = sum(rets)
      const thediff = thesum/N - 1.5 // relies on standard synthetic mapping
      // We can set this deterministically because we've stubbed random
      expect(thediff).to.be.equal(0)
    })

    it("should cache offsets for identical input lengths", () => {
      const transform = generate_jitter({
        distribution: "uniform",
        range: new FactorRange({factors: ["a", "b"]}),
      })

      const val1 = repeat("a", N)
      const val2 = repeat("b", N)

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
