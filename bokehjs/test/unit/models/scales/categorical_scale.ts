import {expect} from "assertions"

import {CategoricalScale} from "@bokehjs/models/scales/categorical_scale"
import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {NumberArray} from '@bokehjs/core/types'

describe("categorical_scale module", () => {

  describe("basic factors", () => {
    const factors = ["foo", "bar", "baz"]

    function mkscale(): CategoricalScale {
      return new CategoricalScale({
        source_range: new FactorRange({factors, range_padding: 0}),
        target_range: new Range1d({start: 20, end: 80}),
      })
    }

    describe("forward mapping", () => {
      it("should map factors evenly", () => {
        const scale = mkscale()
        expect(scale.compute("foo")).to.be.equal(30)
        expect(scale.compute("bar")).to.be.equal(50)
        expect(scale.compute("baz")).to.be.equal(70)
      })
    })

    describe("forward vector mapping", () => {

      it("should return a NumberArray", () => {
        const scale = mkscale()
        const values = scale.v_compute(factors)
        expect(values).to.be.instanceof(NumberArray)
      })

      it("should map factors evenly", () => {
        const scale = mkscale()
        const values = scale.v_compute(factors)
        expect(values).to.be.equal(new NumberArray([30, 50, 70]))
      })
    })

    describe("inverse mapping", () => {
      it("should map factors evenly", () => {
        const scale = mkscale()
        expect(scale.invert(20)).to.be.equal(0)
        expect(scale.invert(30)).to.be.equal(0.5)
        expect(scale.invert(40)).to.be.equal(1)
        expect(scale.invert(50)).to.be.equal(1.5)
        expect(scale.invert(60)).to.be.equal(2)
        expect(scale.invert(70)).to.be.equal(2.5)
        expect(scale.invert(80)).to.be.equal(3)
      })
    })

    describe("inverse vector mapping", () => {
      const rvalues = [18, 20, 26, 28, 30, 32, 34, 38, 40, 42]

      it("should return a NumberArray", () => {
        const scale = mkscale()
        const values = scale.v_invert(rvalues)
        expect(values).to.be.instanceof(NumberArray)
      })

      it("should map factors evenly", () => {
        const scale = mkscale()
        const values = scale.v_invert(rvalues)
        expect(values).to.be.equal(new NumberArray([-0.1, 0, 0.3, 0.4, 0.5, 0.6, 0.7, 0.9, 1.0, 1.1]))
      })
    })

    describe("factor updates", () => {
      const new_factors = ['a', 'b', 'c', 'd']

      it("should cause updated mapped values", () => {
        const scale = mkscale()
        scale.source_range.factors = new_factors

        expect(scale.compute('a')).to.be.equal(27.5)
        expect(scale.compute('b')).to.be.equal(42.5)
        expect(scale.compute('c')).to.be.equal(57.5)
        expect(scale.compute('d')).to.be.equal(72.5)
      })

      it("should cause updated vector mapped values", () => {
        const scale = mkscale()
        scale.source_range.factors = new_factors

        const values = scale.v_compute(new_factors)
        expect(values).to.be.equal(new NumberArray([27.5, 42.5, 57.5, 72.5]))
      })

      it("should cause updated inverse mapped values", () => {
        const scale = mkscale()
        scale.source_range.factors = new_factors

        expect(scale.invert(20)).to.be.equal(0)
        expect(scale.invert(27.5)).to.be.equal(0.5)
        expect(scale.invert(35)).to.be.equal(1)

        expect(scale.invert(35)).to.be.equal(1)
        expect(scale.invert(42.5)).to.be.equal(1.5)
        expect(scale.invert(50)).to.be.equal(2)

        expect(scale.invert(50)).to.be.equal(2)
        expect(scale.invert(57.5)).to.be.equal(2.5)
        expect(scale.invert(65)).to.be.equal(3)

        expect(scale.invert(65)).to.be.equal(3)
        expect(scale.invert(72.5)).to.be.equal(3.5)
        expect(scale.invert(80)).to.be.equal(4)
      })

      it("should cause updated inverse vector mapped values", () => {
        const scale = mkscale()
        scale.source_range.factors = new_factors

        const values = scale.v_invert([20, 27.5, 35, 42.5, 50, 57.5, 65, 72.5, 80])
        expect(values).to.be.equal(new NumberArray([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]))
      })
    })

    describe("categorical offsets", () => {
      it("should apply offsets to mappings", () => {
        const scale = mkscale()
        expect(scale.compute(['foo', -0.6])).to.be.equal(18)
        expect(scale.compute(['foo', -0.5])).to.be.equal(20)
        expect(scale.compute(['foo', -0.2])).to.be.equal(26)
        expect(scale.compute(['foo', -0.1])).to.be.equal(28)
        expect(scale.compute(['foo',  0.0])).to.be.equal(30)
        expect(scale.compute(['foo',  0.1])).to.be.equal(32)
        expect(scale.compute(['foo',  0.2])).to.be.equal(34)
        expect(scale.compute(['foo',  0.5])).to.be.equal(40)
        expect(scale.compute(['foo',  0.6])).to.be.equal(42)

        expect(scale.compute(['bar', -0.6])).to.be.equal(38)
        expect(scale.compute(['bar', -0.5])).to.be.equal(40)
        expect(scale.compute(['bar', -0.2])).to.be.equal(46)
        expect(scale.compute(['bar', -0.1])).to.be.equal(48)
        expect(scale.compute(['bar',  0.0])).to.be.equal(50)
        expect(scale.compute(['bar',  0.1])).to.be.equal(52)
        expect(scale.compute(['bar',  0.2])).to.be.equal(54)
        expect(scale.compute(['bar',  0.5])).to.be.equal(60)
        expect(scale.compute(['bar',  0.6])).to.be.equal(62)

        expect(scale.compute(['baz', -0.6])).to.be.equal(58)
        expect(scale.compute(['baz', -0.5])).to.be.equal(60)
        expect(scale.compute(['baz', -0.2])).to.be.equal(66)
        expect(scale.compute(['baz', -0.1])).to.be.equal(68)
        expect(scale.compute(['baz',  0.0])).to.be.equal(70)
        expect(scale.compute(['baz',  0.1])).to.be.equal(72)
        expect(scale.compute(['baz',  0.2])).to.be.equal(74)
        expect(scale.compute(['baz',  0.5])).to.be.equal(80)
        expect(scale.compute(['baz',  0.6])).to.be.equal(82)
      })

      it("should apply offsets to vector mappings", () => {
        const scale = mkscale()

        const values0 = scale.v_compute([
          ['foo', -0.6], ['foo', -0.5], ['foo', -0.2], ['foo', -0.1], ['foo', 0.0], ['foo', 0.1], ['foo', 0.2], ['foo', 0.5], ['foo', 0.6],
        ])
        expect(values0).to.be.equal(new NumberArray([18, 20, 26, 28, 30, 32, 34, 40, 42]))

        const values1 = scale.v_compute([
          ['bar', -0.6], ['bar', -0.5], ['bar', -0.2], ['bar', -0.1], ['bar', 0.0], ['bar', 0.1], ['bar', 0.2], ['bar', 0.5], ['bar', 0.6],
        ])
        expect(values1).to.be.equal(new NumberArray([38, 40, 46, 48, 50, 52, 54, 60, 62]))

        const values2 = scale.v_compute([
          ['baz', -0.6], ['baz', -0.5], ['baz', -0.2], ['baz', -0.1], ['baz', 0.0], ['baz', 0.1], ['baz', 0.2], ['baz', 0.5], ['baz', 0.6],
        ])
        expect(values2).to.be.equal(new NumberArray([58, 60, 66, 68, 70, 72, 74, 80, 82]))
      })
    })
  })
})
