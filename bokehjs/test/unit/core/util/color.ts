import {expect} from "assertions"

import {color2rgba} from "@bokehjs/core/util/color"

describe("color module", () => {

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
})
