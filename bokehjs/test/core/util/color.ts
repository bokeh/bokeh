{expect} = require "chai"
utils = require "../../utils"

base = utils.require "base"
color = utils.require "core/util/color"

describe "color module", ->

  halfgray = color.color2rgba('rgb(128, 128, 128)')

  it "should turn 6-element hex colors to tuples", ->
    expect(color.color2rgba('#000000')).to.eql [0, 0, 0, 1]
    expect(color.color2rgba('#ff0000')).to.eql [1, 0, 0, 1]
    expect(color.color2rgba('#00ff00')).to.eql [0, 1, 0, 1]
    expect(color.color2rgba('#0000ff')).to.eql [0, 0, 1, 1]
    expect(color.color2rgba('#ffffff')).to.eql [1, 1, 1, 1]
    expect(color.color2rgba('#808080')).to.eql halfgray

  it "should turn 3-element hex colors to tuples", ->
    expect(color.color2rgba('#000')).to.eql [0, 0, 0, 1]
    expect(color.color2rgba('#f00')).to.eql [1, 0, 0, 1]
    expect(color.color2rgba('#0f0')).to.eql [0, 1, 0, 1]
    expect(color.color2rgba('#00f')).to.eql [0, 0, 1, 1]
    expect(color.color2rgba('#fff')).to.eql [1, 1, 1, 1]

  it "should turn known css color names to tuples", ->
    expect(color.color2rgba('red')).to.eql [1, 0, 0, 1]
    expect(color.color2rgba('yellow')).to.eql [1, 1, 0, 1]
    expect(color.color2rgba('gray')).to.eql halfgray

  it "should turn known rgb() colors to tuples", ->
    expect(color.color2rgba('rgb(0, 0, 0)')).to.eql [0, 0, 0, 1]
    expect(color.color2rgba('rgb(255, 0, 0)')).to.eql [1, 0, 0, 1]
    expect(color.color2rgba('rgb(0, 255, 0)')).to.eql [0, 1, 0, 1]
    expect(color.color2rgba('rgb(0, 0, 255)')).to.eql [0, 0, 1, 1]
    expect(color.color2rgba('rgb(128, 128, 128)')).to.eql halfgray

  it "should provide the given alpha value", ->
    expect(color.color2rgba('#ff0000', 0.1)).to.eql [1, 0, 0, 0.1]
    expect(color.color2rgba('#ff0000', 0.5)).to.eql [1, 0, 0, 0.5]
    expect(color.color2rgba('#0f0', 0.5)).to.eql [0, 1, 0, 0.5]
    expect(color.color2rgba('blue', 0.5)).to.eql [0, 0, 1, 0.5]

  it "should turn rgb() colors to tuples", ->
    expect(color.color2rgba('rgb(0, 0, 0)')).to.eql [0, 0, 0, 1]
    expect(color.color2rgba('rgb(255, 0, 0)')).to.eql [1, 0, 0, 1]
    expect(color.color2rgba('rgb(0, 255, 0)')).to.eql [0, 1, 0, 1]
    expect(color.color2rgba('rgb(0, 0, 255)')).to.eql [0, 0, 1, 1]
    expect(color.color2rgba('rgb(128, 128, 128)')).to.eql halfgray

  it "should turn rgba() colors to tuples, overriding alpha", ->
    expect(color.color2rgba('rgba(0, 0, 0, 0)')).to.eql [0, 0, 0, 0]
    expect(color.color2rgba('rgba(0, 0, 0, 0)', 0.5)).to.eql [0, 0, 0, 0]
    expect(color.color2rgba('rgba(255, 0, 0, 1)', 0.5)).to.eql [1, 0, 0, 1]
    expect(color.color2rgba('rgba(255, 0, 0, 0.4)', 0.5)).to.eql [1, 0, 0, 0.4]

  it "should turn NaN or null to transparent color", ->
    expect(color.color2rgba(null)).to.eql [0, 0, 0, 0]
    expect(color.color2rgba('')).to.eql [0, 0, 0, 0]
    expect(color.color2rgba(NaN)).to.eql [0, 0, 0, 0]
    expect(color.color2rgba(NaN, 0.5)).to.eql [0, 0, 0, 0]
    expect(color.color2rgba(NaN, 1.0)).to.eql [0, 0, 0, 0]
