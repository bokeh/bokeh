import {expect} from "chai"

import {color2rgba} from "core/util/color"

describe("color module", () => {

  const halfgray = color2rgba('rgb(128, 128, 128)')

  it("should turn 6-element hex colors to tuples", () => {
    expect(color2rgba('#000000')).to.eql([0, 0, 0, 1])
    expect(color2rgba('#ff0000')).to.eql([1, 0, 0, 1])
    expect(color2rgba('#00ff00')).to.eql([0, 1, 0, 1])
    expect(color2rgba('#0000ff')).to.eql([0, 0, 1, 1])
    expect(color2rgba('#ffffff')).to.eql([1, 1, 1, 1])
    expect(color2rgba('#808080')).to.eql(halfgray)
  })

  it("should turn 3-element hex colors to tuples", () => {
    expect(color2rgba('#000')).to.eql([0, 0, 0, 1])
    expect(color2rgba('#f00')).to.eql([1, 0, 0, 1])
    expect(color2rgba('#0f0')).to.eql([0, 1, 0, 1])
    expect(color2rgba('#00f')).to.eql([0, 0, 1, 1])
    expect(color2rgba('#fff')).to.eql([1, 1, 1, 1])
  })

  it("should turn known css color names to tuples", () => {
    expect(color2rgba('red')).to.eql([1, 0, 0, 1])
    expect(color2rgba('yellow')).to.eql([1, 1, 0, 1])
    expect(color2rgba('gray')).to.eql(halfgray)
  })

  it("should turn known rgb() colors to tuples", () => {
    expect(color2rgba('rgb(0, 0, 0)')).to.eql([0, 0, 0, 1])
    expect(color2rgba('rgb(255, 0, 0)')).to.eql([1, 0, 0, 1])
    expect(color2rgba('rgb(0, 255, 0)')).to.eql([0, 1, 0, 1])
    expect(color2rgba('rgb(0, 0, 255)')).to.eql([0, 0, 1, 1])
    expect(color2rgba('rgb(128, 128, 128)')).to.eql(halfgray)
  })

  it("should provide the given alpha value", () => {
    expect(color2rgba('#ff0000', 0.1)).to.eql([1, 0, 0, 0.1])
    expect(color2rgba('#ff0000', 0.5)).to.eql([1, 0, 0, 0.5])
    expect(color2rgba('#0f0', 0.5)).to.eql([0, 1, 0, 0.5])
    expect(color2rgba('blue', 0.5)).to.eql([0, 0, 1, 0.5])
  })

  it("should turn rgb() colors to tuples", () => {
    expect(color2rgba('rgb(0, 0, 0)')).to.eql([0, 0, 0, 1])
    expect(color2rgba('rgb(255, 0, 0)')).to.eql([1, 0, 0, 1])
    expect(color2rgba('rgb(0, 255, 0)')).to.eql([0, 1, 0, 1])
    expect(color2rgba('rgb(0, 0, 255)')).to.eql([0, 0, 1, 1])
    expect(color2rgba('rgb(128, 128, 128)')).to.eql(halfgray)
  })

  it("should turn rgba() colors to tuples, overriding alpha", () => {
    expect(color2rgba('rgba(0, 0, 0, 0)')).to.eql([0, 0, 0, 0])
    expect(color2rgba('rgba(0, 0, 0, 0)', 0.5)).to.eql([0, 0, 0, 0])
    expect(color2rgba('rgba(255, 0, 0, 1)', 0.5)).to.eql([1, 0, 0, 1])
    expect(color2rgba('rgba(255, 0, 0, 0.4)', 0.5)).to.eql([1, 0, 0, 0.4])
  })

  it("should turn NaN or null to transparent color", () => {
    // XXX: any required due to mismatch between function's signature
    //      and its garbage in/garbage out implementation.
    expect(color2rgba(null as any)).to.eql([0, 0, 0, 0])
    expect(color2rgba(''   as any)).to.eql([0, 0, 0, 0])
    expect(color2rgba(NaN  as any)).to.eql([0, 0, 0, 0])
    expect(color2rgba(NaN  as any, 0.5)).to.eql([0, 0, 0, 0])
    expect(color2rgba(NaN  as any, 1.0)).to.eql([0, 0, 0, 0])
  })
})
