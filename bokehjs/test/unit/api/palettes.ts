import {expect} from "assertions"

import {interp_palette, linear_palette, varying_alpha_palette} from "@bokehjs/api/palettes"

describe("in api/palettes module", () => {
  describe("interp_palette", () => {
    // Equivalent tests to bokeh's python unit tests for this function.
    it("should support fixed alpha", () => {
      const palette = ["black", "red"]
      expect(interp_palette(palette, 0)).to.be.equal([])
      expect(interp_palette(palette, 1)).to.be.equal([[0, 0, 0, 255]])
      expect(interp_palette(palette, 2)).to.be.equal([[0, 0, 0, 255], [255, 0, 0, 255]])
      expect(interp_palette(palette, 3)).to.be.equal([[0, 0, 0, 255], [128, 0, 0, 255], [255, 0, 0, 255]])
      expect(interp_palette(palette, 4)).to.be.equal([[0, 0, 0, 255], [85, 0, 0, 255], [170, 0, 0, 255], [255, 0, 0, 255]])
    })

    it("should support varying alpha", () => {
      const palette = ["#00ff0080", "#00ffff40"]
      expect(interp_palette(palette, 1)).to.be.equal([[0, 255, 0, 128]])
      expect(interp_palette(palette, 2)).to.be.equal([[0, 255, 0, 128], [0, 255, 255, 64]])
      expect(interp_palette(palette, 3)).to.be.equal([[0, 255, 0, 128], [0, 255, 128, 96], [0, 255, 255, 64]])
      expect(interp_palette(palette, 4)).to.be.equal([[0, 255, 0, 128], [0, 255, 85, 107], [0, 255, 170, 85], [0, 255, 255, 64]])
    })

    it("should support passing single color palette", () => {
      const palette = ["red"]
      expect(interp_palette(palette, 0)).to.be.equal([])
      expect(interp_palette(palette, 1)).to.be.equal([[255, 0, 0, 255]])
      expect(interp_palette(palette, 2)).to.be.equal([[255, 0, 0, 255], [255, 0, 0, 255]])
    })

    it("should throw error if pass empty palette", () => {
      expect(() => interp_palette([], 1)).to.throw(Error)
    })

    it("should throw error if request negative length", () => {
      expect(() => interp_palette(["red"], -1)).to.throw(Error)
    })
  })

  describe("linear_palette", () => {
    const palette = ["red", "green", "blue", "black", "yellow", "magenta"]

    it("should support returning empty palette", () => {
      expect(linear_palette(palette, 0)).to.be.equal([])
    })

    it("should support returning subset of palette", () => {
      expect(linear_palette(palette, 1)).to.be.equal(["red"])
      expect(linear_palette(palette, 2)).to.be.equal(["red", "magenta"])
      expect(linear_palette(palette, 3)).to.be.equal(["red", "blue", "magenta"])
      expect(linear_palette(palette, 4)).to.be.equal(["red", "green", "black", "magenta"])
      expect(linear_palette(palette, 5)).to.be.equal(["red", "green", "blue", "black", "magenta"])
      expect(linear_palette(palette, 6)).to.be.equal(palette)
    })

    it("should throw error if request too many entries", () => {
      expect(() => linear_palette(palette, 7)).to.throw(Error)
    })
  })

  describe("varying_alpha_palette", () => {
    // Equivalent tests to bokeh's python unit tests for this function.
    it("should support RGB color", () => {
      expect(varying_alpha_palette("blue", 3)).to.be.equal(["#0000ff00", "#0000ff80", "#0000ff"])
      expect(varying_alpha_palette("red", 3, 255, 128)).to.be.equal(["#ff0000", "#ff0000c0", "#ff000080"])
      expect(varying_alpha_palette("#123456", 3, 205, 205)).to.be.equal(["#123456cd", "#123456cd", "#123456cd"])
      expect(varying_alpha_palette("#abc", 3)).to.be.equal(["#aabbcc00", "#aabbcc80", "#aabbcc"])

      const palette = varying_alpha_palette("blue")
      expect(palette.length).to.be.equal(256)
      expect(palette[0]).to.be.equal("#0000ff00")
      expect(palette[63]).to.be.equal("#0000ff3f")
      expect(palette[127]).to.be.equal("#0000ff7f")
      expect(palette[191]).to.be.equal("#0000ffbf")

      expect(varying_alpha_palette("#654321", null, 100, 103)).to.be.equal(["#65432164", "#65432165", "#65432166", "#65432167"])
    })

    it("should raise error if bad argument", () => {
      expect(() => varying_alpha_palette("red", null, -1)).to.throw(Error)
      expect(() => varying_alpha_palette("red", null, 256)).to.throw(Error)
      expect(() => varying_alpha_palette("red", null, 0, -1)).to.throw(Error)
      expect(() => varying_alpha_palette("red", null, 0, 256)).to.throw(Error)
    })

    it("should support RGBA color", () => {
      expect(varying_alpha_palette("#FFAA8080", 3)).to.be.equal(["#ffaa8000", "#ffaa8040", "#ffaa8080"])
      expect(varying_alpha_palette("#80FFAA80", 3, 255, 0)).to.be.equal(["#80ffaa80", "#80ffaa40", "#80ffaa00"])
      expect(varying_alpha_palette("#AABBCC80", 3, 128)).to.be.equal(["#aabbcc40", "#aabbcc60", "#aabbcc80"])
      expect(varying_alpha_palette("#12345680", 3, 0, 128)).to.be.equal(["#12345600", "#12345620", "#12345640"])

      expect(varying_alpha_palette("#FFAA8080").length).to.be.equal(129)
      expect(varying_alpha_palette("#FFAA8080", null, 0, 128).length).to.be.equal(65)
    })
  })
})
