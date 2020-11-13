import {expect} from "assertions"

import {color2rgba, css4_parse} from "@bokehjs/core/util/color"

describe("core/util/color module", () => {
  const halfgray = color2rgba('rgb(128, 128, 128)')

  it("should turn 6-element hex colors to tuples", () => {
    expect(color2rgba('#000000')).to.be.equal([0, 0, 0, 1])
    expect(color2rgba('#ff0000')).to.be.equal([1, 0, 0, 1])
    expect(color2rgba('#00ff00')).to.be.equal([0, 1, 0, 1])
    expect(color2rgba('#0000ff')).to.be.equal([0, 0, 1, 1])
    expect(color2rgba('#ffffff')).to.be.equal([1, 1, 1, 1])
    expect(color2rgba('#808080')).to.be.equal(halfgray)
  })

  it("should turn 3-element hex colors to tuples", () => {
    expect(color2rgba('#000')).to.be.equal([0, 0, 0, 1])
    expect(color2rgba('#f00')).to.be.equal([1, 0, 0, 1])
    expect(color2rgba('#0f0')).to.be.equal([0, 1, 0, 1])
    expect(color2rgba('#00f')).to.be.equal([0, 0, 1, 1])
    expect(color2rgba('#fff')).to.be.equal([1, 1, 1, 1])
  })

  it("should turn known css color names to tuples", () => {
    expect(color2rgba('red')).to.be.equal([1, 0, 0, 1])
    expect(color2rgba('yellow')).to.be.equal([1, 1, 0, 1])
    expect(color2rgba('gray')).to.be.equal(halfgray)
  })

  it("should turn known rgb() colors to tuples", () => {
    expect(color2rgba('rgb(0, 0, 0)')).to.be.equal([0, 0, 0, 1])
    expect(color2rgba('rgb(255, 0, 0)')).to.be.equal([1, 0, 0, 1])
    expect(color2rgba('rgb(0, 255, 0)')).to.be.equal([0, 1, 0, 1])
    expect(color2rgba('rgb(0, 0, 255)')).to.be.equal([0, 0, 1, 1])
    expect(color2rgba('rgb(128, 128, 128)')).to.be.equal(halfgray)
  })

  it("should provide the given alpha value", () => {
    expect(color2rgba('#ff0000', 0.1)).to.be.equal([1, 0, 0, 0.1])
    expect(color2rgba('#ff0000', 0.5)).to.be.equal([1, 0, 0, 0.5])
    expect(color2rgba('#0f0', 0.5)).to.be.equal([0, 1, 0, 0.5])
    expect(color2rgba('blue', 0.5)).to.be.equal([0, 0, 1, 0.5])
  })

  it("should turn rgb() colors to tuples", () => {
    expect(color2rgba('rgb(0, 0, 0)')).to.be.equal([0, 0, 0, 1])
    expect(color2rgba('rgb(255, 0, 0)')).to.be.equal([1, 0, 0, 1])
    expect(color2rgba('rgb(0, 255, 0)')).to.be.equal([0, 1, 0, 1])
    expect(color2rgba('rgb(0, 0, 255)')).to.be.equal([0, 0, 1, 1])
    expect(color2rgba('rgb(128, 128, 128)')).to.be.equal(halfgray)
  })

  it("should turn rgba() colors to tuples, overriding alpha", () => {
    expect(color2rgba('rgba(0, 0, 0, 0)')).to.be.equal([0, 0, 0, 0])
    expect(color2rgba('rgba(0, 0, 0, 0)', 0.5)).to.be.equal([0, 0, 0, 0])
    expect(color2rgba('rgba(255, 0, 0, 1)', 0.5)).to.be.equal([1, 0, 0, 1])
    expect(color2rgba('rgba(255, 0, 0, 0.4)', 0.5)).to.be.equal([1, 0, 0, 0.4])
  })

  it("should turn NaN or null to transparent color", () => {
    // XXX: any required due to mismatch between function's signature
    //      and its garbage in/garbage out implementation.
    expect(color2rgba(null as any)).to.be.equal([0, 0, 0, 0])
    expect(color2rgba(''   as any)).to.be.equal([0, 0, 0, 0])
    expect(color2rgba(NaN  as any)).to.be.equal([0, 0, 0, 0])
    expect(color2rgba(NaN  as any, 0.5)).to.be.equal([0, 0, 0, 0])
    expect(color2rgba(NaN  as any, 1.0)).to.be.equal([0, 0, 0, 0])
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

      expect(css4_parse("rgb(255 127 0)")).to.be.equal([255, 127, 0, 255])
      expect(css4_parse("rgb(255 127 0 / 1.0)")).to.be.equal([255, 127, 0, 255])
      expect(css4_parse("rgb(255 127 0 / 100%)")).to.be.equal([255, 127, 0, 255])

      expect(css4_parse("rgb(100% 50% 0%)")).to.be.equal([255, 127, 0, 255])
      expect(css4_parse("rgb(100% 50% 0% / 1.0)")).to.be.equal([255, 127, 0, 255])
      expect(css4_parse("rgb(100% 50% 0% / 100%)")).to.be.equal([255, 127, 0, 255])

      expect(css4_parse("rgba(255 127 0)")).to.be.equal([255, 127, 0, 255])
      expect(css4_parse("rgba(255 127 0 / 1.0)")).to.be.equal([255, 127, 0, 255])
      expect(css4_parse("rgba(255 127 0 / 100%)")).to.be.equal([255, 127, 0, 255])

      expect(css4_parse("rgba(100% 50% 0%)")).to.be.equal([255, 127, 0, 255])
      expect(css4_parse("rgba(100% 50% 0% / 1.0)")).to.be.equal([255, 127, 0, 255])
      expect(css4_parse("rgba(100% 50% 0% / 100%)")).to.be.equal([255, 127, 0, 255])

      expect(css4_parse("rgb(255, 127, 0)")).to.be.equal([255, 127, 0, 255])
      expect(css4_parse("rgb(255, 127, 0, 1.0)")).to.be.equal([255, 127, 0, 255])
      expect(css4_parse("rgb(255, 127, 0, 100%)")).to.be.equal([255, 127, 0, 255])

      expect(css4_parse("rgb(100%, 50%, 0%)")).to.be.equal([255, 127, 0, 255])
      expect(css4_parse("rgb(100%, 50%, 0%, 1.0)")).to.be.equal([255, 127, 0, 255])
      expect(css4_parse("rgb(100%, 50%, 0%, 100%)")).to.be.equal([255, 127, 0, 255])

      expect(css4_parse("rgba(255, 127, 0)")).to.be.equal([255, 127, 0, 255])
      expect(css4_parse("rgba(255, 127, 0, 1.0)")).to.be.equal([255, 127, 0, 255])
      expect(css4_parse("rgba(255, 127, 0, 100%)")).to.be.equal([255, 127, 0, 255])

      expect(css4_parse("rgba(100%, 50%, 0%)")).to.be.equal([255, 127, 0, 255])
      expect(css4_parse("rgba(100%, 50%, 0%, 1.0)")).to.be.equal([255, 127, 0, 255])
      expect(css4_parse("rgba(100%, 50%, 0%, 100%)")).to.be.equal([255, 127, 0, 255])
    })
  })
})
