import {expect} from "assertions"

import {LogColorMapper} from "@bokehjs/models/mappers/log_color_mapper"

describe("LogColorMapper module", () => {

  describe("LogColorMapper.rgba_mapper.v_compute() method", () => {

    it("Should correctly map values along log scale", () => {
      const palette = ["#3288bd", "#abdda4", "#fee08b"]
      const color_mapper = new LogColorMapper({low: 2, high: 25, palette})

      const buf8_0 = color_mapper.rgba_mapper.v_compute([2])
      expect([buf8_0[0], buf8_0[1], buf8_0[2], buf8_0[3]]).to.be.equal([50, 136, 189, 255])

      const buf8_1 = color_mapper.rgba_mapper.v_compute([20])
      expect([buf8_1[0], buf8_1[1], buf8_1[2], buf8_1[3]]).to.be.equal([254, 224, 139, 255])
    })

  })

  describe("LogColorMapper.v_compute method", () => {

    it("Should map data below low value to low", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = new LogColorMapper({low: 1, high: 100, palette})

      const vals = color_mapper.v_compute([0, 1, 10])
      expect(vals).to.be.equal(["red", "red", "green"])
    })

    it("Should map data above high value to high", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = new LogColorMapper({low: 1, high: 100, palette})

      const vals = color_mapper.v_compute([10, 100, 101])
      expect(vals).to.be.equal(["green", "blue", "blue"])
    })

    it("Should map data NaN to nan_color value", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = new LogColorMapper({low: 1, high: 100, palette, nan_color: "gray"})

      const vals = color_mapper.v_compute([1, NaN, 100])
      expect(vals).to.be.equal(["red", "gray", "blue"])
    })

    it("Should map data NaN to nan_color value when high/low not set", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = new LogColorMapper({palette, nan_color: "gray"})

      const vals = color_mapper.v_compute([1, NaN, 100])
      expect(vals).to.be.equal(["red", "gray", "blue"])
    })

    it("Should map high/low values to high_color/low_color, if provided", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = new LogColorMapper({low: 1, high: 100, low_color: "pink", high_color: "orange", palette})

      const vals = color_mapper.v_compute([0.5, 1, 10, 100, 101])
      expect(vals).to.be.equal(["pink", "red", "green", "blue", "orange"])
    })
  })
})
