import {expect} from "assertions"

import {color2rgba, css4_parse, brightness, luminance} from "@bokehjs/core/util/color"

describe("core/util/color module", () => {
  const halfgray = color2rgba("rgb(128, 128, 128)")

  describe("implements color2rgba() function", () => {

    it("which should support 6-element hex colors", () => {
      expect(color2rgba("#000000")).to.be.equal([0, 0, 0, 255])
      expect(color2rgba("#ff0000")).to.be.equal([255, 0, 0, 255])
      expect(color2rgba("#00ff00")).to.be.equal([0, 255, 0, 255])
      expect(color2rgba("#0000ff")).to.be.equal([0, 0, 255, 255])
      expect(color2rgba("#ffffff")).to.be.equal([255, 255, 255, 255])
      expect(color2rgba("#808080")).to.be.equal(halfgray)
    })

    it("which should support 6-element hex colors with separate alpha", () => {
      expect(color2rgba("#000000", 0.5)).to.be.equal([0, 0, 0, 128])
      expect(color2rgba("#ff0000", 1.0)).to.be.equal([255, 0, 0, 255])
      expect(color2rgba("#00ff00", 0.2)).to.be.equal([0, 255, 0, 51])
      expect(color2rgba("#0000ff", 0.8)).to.be.equal([0, 0, 255, 204])
      expect(color2rgba("#ffffff", 0.0)).to.be.equal([255, 255, 255, 0])
      expect(color2rgba("#808080", 1.0)).to.be.equal(halfgray)
    })

    it("which should support 8-element hex colors", () => {
      expect(color2rgba("#000000ff")).to.be.equal([0, 0, 0, 255])
      expect(color2rgba("#ff000080")).to.be.equal([255, 0, 0, 128])
      expect(color2rgba("#00ff0080")).to.be.equal([0, 255, 0, 128])
      expect(color2rgba("#0000ff00")).to.be.equal([0, 0, 255, 0])
      expect(color2rgba("#ffffffff")).to.be.equal([255, 255, 255, 255])
      expect(color2rgba("#808080ff")).to.be.equal(halfgray)
    })

    it("which should support 8-element hex colors with separate alpha", () => {
      expect(color2rgba("#000000ff", 0.5)).to.be.equal([0, 0, 0, 128])
      expect(color2rgba("#ff000080", 1.0)).to.be.equal([255, 0, 0, 128])
      expect(color2rgba("#00ff0080", 0.2)).to.be.equal([0, 255, 0, 26])
      expect(color2rgba("#0000ff00", 0.8)).to.be.equal([0, 0, 255, 0])
      expect(color2rgba("#ffffffff", 0.0)).to.be.equal([255, 255, 255, 0])
      expect(color2rgba("#808080ff", 1.0)).to.be.equal(halfgray)
    })

    it("which should support 3-element hex colors", () => {
      expect(color2rgba("#000")).to.be.equal([0, 0, 0, 255])
      expect(color2rgba("#f00")).to.be.equal([255, 0, 0, 255])
      expect(color2rgba("#0f0")).to.be.equal([0, 255, 0, 255])
      expect(color2rgba("#00f")).to.be.equal([0, 0, 255, 255])
      expect(color2rgba("#fff")).to.be.equal([255, 255, 255, 255])
    })

    it("which should support 3-element hex colors with separate alpha", () => {
      expect(color2rgba("#000", 1.0)).to.be.equal([0, 0, 0, 255])
      expect(color2rgba("#f00", 0.0)).to.be.equal([255, 0, 0, 0])
      expect(color2rgba("#0f0", 0.5)).to.be.equal([0, 255, 0, 128])
      expect(color2rgba("#00f", 0.2)).to.be.equal([0, 0, 255, 51])
      expect(color2rgba("#fff", 0.8)).to.be.equal([255, 255, 255, 204])
    })

    it("which should support known css color names", () => {
      expect(color2rgba("red")).to.be.equal([255, 0, 0, 255])
      expect(color2rgba("yellow")).to.be.equal([255, 255, 0, 255])
      expect(color2rgba("gray")).to.be.equal(halfgray)
    })

    it("which should support known css color names with separate alpha", () => {
      expect(color2rgba("red", 0.5)).to.be.equal([255, 0, 0, 128])
      expect(color2rgba("yellow", 0.0)).to.be.equal([255, 255, 0, 0])
      expect(color2rgba("blue", 0.2)).to.be.equal([0, 0, 255, 51])
      expect(color2rgba("gray", 1.0)).to.be.equal(halfgray)
    })

    it("which should support known rgb() colors", () => {
      expect(color2rgba("rgb(0, 0, 0)")).to.be.equal([0, 0, 0, 255])
      expect(color2rgba("rgb(255, 0, 0)")).to.be.equal([255, 0, 0, 255])
      expect(color2rgba("rgb(0, 255, 0)")).to.be.equal([0, 255, 0, 255])
      expect(color2rgba("rgb(0, 0, 255)")).to.be.equal([0, 0, 255, 255])
      expect(color2rgba("rgb(128, 128, 128)")).to.be.equal(halfgray)
    })

    it("which should support known rgb() colors with separate alpha", () => {
      expect(color2rgba("rgb(0, 0, 0)", 0.5)).to.be.equal([0, 0, 0, 128])
      expect(color2rgba("rgb(255, 0, 0)", 0.0)).to.be.equal([255, 0, 0, 0])
      expect(color2rgba("rgb(0, 255, 0)", 1.0)).to.be.equal([0, 255, 0, 255])
      expect(color2rgba("rgb(0, 0, 255)", 0.2)).to.be.equal([0, 0, 255, 51])
      expect(color2rgba("rgb(128, 128, 128)", 1.0)).to.be.equal(halfgray)
    })

    it("which should support rgba() colors", () => {
      expect(color2rgba("rgba(0, 0, 0, 0)")).to.be.equal([0, 0, 0, 0])
      expect(color2rgba("rgba(0, 255, 0, 0.2)")).to.be.equal([0, 255, 0, 51])
      expect(color2rgba("rgba(255, 0, 0, 0.4)")).to.be.equal([255, 0, 0, 102])
      expect(color2rgba("rgba(0, 0, 128, 0.8)")).to.be.equal([0, 0, 128, 204])
      expect(color2rgba("rgba(0, 128, 0, 1.0)")).to.be.equal([0, 128, 0, 255])
    })

    it("which should support rgba() colors with separate alpha", () => {
      expect(color2rgba("rgba(0, 0, 0, 0)", 1.0)).to.be.equal([0, 0, 0, 0])
      expect(color2rgba("rgba(0, 0, 0, 0)", 0.5)).to.be.equal([0, 0, 0, 0])
      expect(color2rgba("rgba(255, 0, 0, 0.4)", 0)).to.be.equal([255, 0, 0, 0])
      expect(color2rgba("rgba(255, 0, 0, 0.4)", 0.5)).to.be.equal([255, 0, 0, 51])
      expect(color2rgba("rgba(255, 0, 0, 0.4)", 1.0)).to.be.equal([255, 0, 0, 102])
      expect(color2rgba("rgba(0, 128, 0, 1.0)", 0)).to.be.equal([0, 128, 0, 0])
      expect(color2rgba("rgba(0, 128, 0, 1.0)", 0.5)).to.be.equal([0, 128, 0, 128])
      expect(color2rgba("rgba(0, 128, 0, 1.0)", 1.0)).to.be.equal([0, 128, 0, 255])
    })

    it("which should support 2-tuple [CSS, alpha] inputs", () => {
      expect(color2rgba(["transparent", 0.0])).to.be.equal([0, 0, 0, 0])
      expect(color2rgba(["transparent", 0.8])).to.be.equal([0, 0, 0, 0])
      expect(color2rgba(["red", 0.0])).to.be.equal([255, 0, 0, 0])
      expect(color2rgba(["red", 0.8])).to.be.equal([255, 0, 0, 204])
      expect(color2rgba(["rgb(255 0 0)", 0.0])).to.be.equal([255, 0, 0, 0])
      expect(color2rgba(["rgb(255 0 0)", 0.8])).to.be.equal([255, 0, 0, 204])
    })

    it("which should support 2-tuple [CSS, alpha] inputs with separate alpha", () => {
      expect(color2rgba(["transparent", 0.0], 0.5)).to.be.equal([0, 0, 0, 0])
      expect(color2rgba(["transparent", 0.8], 0.5)).to.be.equal([0, 0, 0, 0])
      expect(color2rgba(["red", 0.0], 0.5)).to.be.equal([255, 0, 0, 0])
      expect(color2rgba(["red", 0.8], 0.5)).to.be.equal([255, 0, 0, 102])
      expect(color2rgba(["rgb(255 0 0)", 0.0], 0.5)).to.be.equal([255, 0, 0, 0])
      expect(color2rgba(["rgb(255 0 0)", 0.8], 0.5)).to.be.equal([255, 0, 0, 102])
    })

    it("which should clamp alpha between 0 and 1", () => {
      expect(color2rgba("rgb(128, 128, 128)", 1.1)).to.be.equal([128, 128, 128, 255])
      expect(color2rgba("rgb(128, 128, 128)", -0.1)).to.be.equal([128, 128, 128, 0])
    })
  })

  describe("should support css4_parse() function", () => {
    it("that supports 'transparent' keyword", () => {
      expect(css4_parse("")).to.be.null
      expect(css4_parse("   ")).to.be.null

      expect(css4_parse("  transparent   ")).to.be.equal([0, 0, 0, 0])
      expect(css4_parse("transparent")).to.be.equal([0, 0, 0, 0])
      expect(css4_parse("  TRANSPARENT   ")).to.be.equal([0, 0, 0, 0])
      expect(css4_parse("TRANSPARENT")).to.be.equal([0, 0, 0, 0])
      expect(css4_parse("  TrAnSpArEnT   ")).to.be.equal([0, 0, 0, 0])
      expect(css4_parse("TrAnSpArEnT")).to.be.equal([0, 0, 0, 0])
    })

    it("that supports hex strings", () => {
      expect(css4_parse("#FFFFFFFF")).to.be.equal([0xFF, 0xFF, 0xFF, 0xFF])
      expect(css4_parse("#FFFFFF")).to.be.equal([0xFF, 0xFF, 0xFF, 0xFF])
      expect(css4_parse("#FFFF")).to.be.equal([0xFF, 0xFF, 0xFF, 0xFF])
      expect(css4_parse("#FFF")).to.be.equal([0xFF, 0xFF, 0xFF, 0xFF])

      expect(css4_parse("#AABBCCDD")).to.be.equal([0xAA, 0xBB, 0xCC, 0xDD])
      expect(css4_parse("#AABBCC")).to.be.equal([0xAA, 0xBB, 0xCC, 0xFF])
      expect(css4_parse("#ABCD")).to.be.equal([0xAA, 0xBB, 0xCC, 0xDD])
      expect(css4_parse("#ABC")).to.be.equal([0xAA, 0xBB, 0xCC, 0xFF])

      expect(css4_parse("#aAbBcCdD")).to.be.equal([0xAA, 0xBB, 0xCC, 0xDD])
      expect(css4_parse("#aAbBcC")).to.be.equal([0xAA, 0xBB, 0xCC, 0xFF])
      expect(css4_parse("#aBcD")).to.be.equal([0xAA, 0xBB, 0xCC, 0xDD])
      expect(css4_parse("#aBc")).to.be.equal([0xAA, 0xBB, 0xCC, 0xFF])

      expect(css4_parse("#aabbccdd")).to.be.equal([0xAA, 0xBB, 0xCC, 0xDD])
      expect(css4_parse("#aabbcc")).to.be.equal([0xAA, 0xBB, 0xCC, 0xFF])
      expect(css4_parse("#abcd")).to.be.equal([0xAA, 0xBB, 0xCC, 0xDD])
      expect(css4_parse("#abc")).to.be.equal([0xAA, 0xBB, 0xCC, 0xFF])

      expect(css4_parse("  #aabbccdd   ")).to.be.equal([0xAA, 0xBB, 0xCC, 0xDD])
      expect(css4_parse("  #aabbcc   ")).to.be.equal([0xAA, 0xBB, 0xCC, 0xFF])
      expect(css4_parse("  #abcd   ")).to.be.equal([0xAA, 0xBB, 0xCC, 0xDD])
      expect(css4_parse("  #abc   ")).to.be.equal([0xAA, 0xBB, 0xCC, 0xFF])

      expect(css4_parse("#aabbccdg")).to.be.null
      expect(css4_parse("#aabbcg")).to.be.null
      expect(css4_parse("#abcg")).to.be.null
      expect(css4_parse("#abg")).to.be.null

      expect(css4_parse("#aabbccdde")).to.be.null
      expect(css4_parse("#aabbcce")).to.be.null
      expect(css4_parse("#abcde")).to.be.null
      expect(css4_parse("#ab")).to.be.null
    })

    it("that supports rgb() and rgba() syntax", () => {
      expect(css4_parse("rgb(255 128 0)")).to.be.equal([255, 128, 0, 255])
      expect(css4_parse("rgb(255 128 0 / 1.0)")).to.be.equal([255, 128, 0, 255])
      expect(css4_parse("rgb(255 128 0 / 100%)")).to.be.equal([255, 128, 0, 255])

      expect(css4_parse("rgb(100% 50% 0%)")).to.be.equal([255, 128, 0, 255])
      expect(css4_parse("rgb(100% 50% 0% / 1.0)")).to.be.equal([255, 128, 0, 255])
      expect(css4_parse("rgb(100% 50% 0% / 100%)")).to.be.equal([255, 128, 0, 255])

      expect(css4_parse("rgba(255 128 0)")).to.be.equal([255, 128, 0, 255])
      expect(css4_parse("rgba(255 128 0 / 1.0)")).to.be.equal([255, 128, 0, 255])
      expect(css4_parse("rgba(255 128 0 / 100%)")).to.be.equal([255, 128, 0, 255])

      expect(css4_parse("rgba(100% 50% 0%)")).to.be.equal([255, 128, 0, 255])
      expect(css4_parse("rgba(100% 50% 0% / 1.0)")).to.be.equal([255, 128, 0, 255])
      expect(css4_parse("rgba(100% 50% 0% / 100%)")).to.be.equal([255, 128, 0, 255])

      expect(css4_parse("rgb(255, 128, 0)")).to.be.equal([255, 128, 0, 255])
      expect(css4_parse("rgb(255, 128, 0, 1.0)")).to.be.equal([255, 128, 0, 255])
      expect(css4_parse("rgb(255, 128, 0, 100%)")).to.be.equal([255, 128, 0, 255])

      expect(css4_parse("rgb(100%, 50%, 0%)")).to.be.equal([255, 128, 0, 255])
      expect(css4_parse("rgb(100%, 50%, 0%, 1.0)")).to.be.equal([255, 128, 0, 255])
      expect(css4_parse("rgb(100%, 50%, 0%, 100%)")).to.be.equal([255, 128, 0, 255])

      expect(css4_parse("rgba(255, 128, 0)")).to.be.equal([255, 128, 0, 255])
      expect(css4_parse("rgba(255, 128, 0, 1.0)")).to.be.equal([255, 128, 0, 255])
      expect(css4_parse("rgba(255, 128, 0, 100%)")).to.be.equal([255, 128, 0, 255])

      expect(css4_parse("rgba(100%, 50%, 0%)")).to.be.equal([255, 128, 0, 255])
      expect(css4_parse("rgba(100%, 50%, 0%, 1.0)")).to.be.equal([255, 128, 0, 255])
      expect(css4_parse("rgba(100%, 50%, 0%, 100%)")).to.be.equal([255, 128, 0, 255])
    })

    it("that supports other CSS4 syntax", () => {
      expect(css4_parse("hsl(0deg 0% 0%)")).to.be.equal([0, 0, 0, 255])
      expect(css4_parse("hsl(0deg 0% 0% / 0)")).to.be.equal([0, 0, 0, 0])
      expect(css4_parse("hsl(0deg 0% 0% / 1)")).to.be.equal([0, 0, 0, 255])

      expect(css4_parse("hsl(240deg 100% 50%)")).to.be.equal([0, 0, 255, 255])
      expect(css4_parse("hsl(240deg 100% 50% / 0)")).to.be.equal([0, 0, 255, 0])
      expect(css4_parse("hsl(240deg 100% 50% / 1)")).to.be.equal([0, 0, 255, 255])

      expect(css4_parse("hsl(x 0% 0%)")).to.be.null
      expect(css4_parse("hsl(0deg 0% 0% 0)")).to.be.null
      expect(css4_parse("hsl(0deg 0% 0% 1)")).to.be.null
    })
  })

  it("should support brightness() function", () => {
    expect(brightness([  0,   0,   0])).to.be.similar(0.000)
    expect(brightness([127, 127, 127])).to.be.similar(0.498)
    expect(brightness([128, 128, 128])).to.be.similar(0.502)
    expect(brightness([255, 255, 255])).to.be.similar(1.000)
  })

  it("should support luminance() function", () => {
    expect(luminance([  0,   0,   0])).to.be.similar(0.000)
    expect(luminance([190,   0, 190])).to.be.similar(0.149)
    expect(luminance([130, 130,  90])).to.be.similar(0.218)
    expect(luminance([255, 255, 255])).to.be.similar(1.000)
  })
})
