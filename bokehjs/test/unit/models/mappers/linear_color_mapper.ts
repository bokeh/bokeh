import {expect} from "assertions"

import {LinearColorMapper} from "@bokehjs/models/mappers/linear_color_mapper"

describe("LinearColorMapper module", () => {

  describe("LinearColorMapper.v_compute method", () => {

    it("Should map values along linear scale with high/low unset", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = new LinearColorMapper({palette})

      const vals0 = color_mapper.v_compute([99.999, 67, 50, 32, 0.0001])
      expect(vals0).to.be.equal(["blue", "blue", "green", "red", "red"])

      const vals1 = color_mapper.v_compute([0.0001, 32, 50, 67, 99.999])
      expect(vals1).to.be.equal(["red", "red", "green", "blue", "blue"])

      const vals2 = color_mapper.v_compute([1, 2, 3])
      expect(vals2).to.be.equal(["red", "green", "blue"])

      const vals3 = color_mapper.v_compute([3, 2, 1])
      expect(vals3).to.be.equal(["blue", "green", "red"])

      const vals4 = color_mapper.v_compute([0, 1, 2])
      expect(vals4).to.be.equal(["red", "green", "blue"])

      const vals5 = color_mapper.v_compute([2, 1, 0])
      expect(vals5).to.be.equal(["blue", "green", "red"])

      const vals6 = color_mapper.v_compute([-1, 0, 1])
      expect(vals6).to.be.equal(["red", "green", "blue"])

      const vals7 = color_mapper.v_compute([1, 0, -1])
      expect(vals7).to.be.equal(["blue", "green", "red"])
    })

    it("Should map values along linear scale with high/low set", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = new LinearColorMapper({low: 1, high: 3, palette})

      const vals = color_mapper.v_compute([1, 2, 3])
      expect(vals).to.be.equal(["red", "green", "blue"])
    })

    it("Should map values along linear scale with high/low set in other direction", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = new LinearColorMapper({low: 3, high: 1, palette})

      const vals = color_mapper.v_compute([1, 2, 3])
      expect(vals).to.be.equal(["blue", "green", "red"])
    })

    it("Should map data below low value to low", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = new LinearColorMapper({low: 1, high: 3, palette})

      const vals = color_mapper.v_compute([0, 1, 2])
      expect(vals).to.be.equal(["red", "red", "green"])
    })

    it("Should map data above high value to high", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = new LinearColorMapper({low: 1, high: 3, palette})

      const vals = color_mapper.v_compute([2, 3, 4])
      expect(vals).to.be.equal(["green", "blue", "blue"])
    })

    it("Should map data NaN to nan_color value", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = new LinearColorMapper({low: 1, high: 3, palette, nan_color: "gray" })

      const vals = color_mapper.v_compute([1, NaN, 3])
      expect(vals).to.be.equal(["red", "gray", "blue"])
    })

    it("Should map data NaN to nan_color value when high/low not set", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = new LinearColorMapper({palette, nan_color: "gray"})

      const vals = color_mapper.v_compute([1, NaN, 3])
      expect(vals).to.be.equal(["red", "gray", "blue"])
    })

    it("Should map high/low values to high_color/low_color, if provided", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = new LinearColorMapper({low: 0, high: 2, palette, low_color: "pink", high_color: "orange"})

      const vals = color_mapper.v_compute([-1, 0, 1, 2, 3])
      expect(vals).to.be.equal(["pink", "red", "green", "blue", "orange"])
    })
  })
})
