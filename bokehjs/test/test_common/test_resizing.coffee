{expect} = require "chai"
utils = require "../utils"
fixtures = require "./fixtures/object"

plot = utils.require "common/plot"

describe "plot module", ->

  get_size = plot.get_size_for_available_space
  
  it "should return null when not using width nor height", ->
    expect(get_size(false, false, 50, 50, 1, 10)).to.eql null
  
  it "should scale well when using width", ->
    expect(get_size(true, false, 50, 50, 1, 10)).to.eql [50, 50]
    expect(get_size(true, false, 50, 40, 1, 10)).to.eql [50, 50]
    expect(get_size(true, false, 50, 60, 1, 10)).to.eql [50, 50]
    expect(get_size(true, false, 50, 50, 2, 10)).to.eql [50, 25]
    expect(get_size(true, false, 50, 50, 0.5, 10)).to.eql [50, 100]
  
  it "should scale well when using height", ->
    expect(get_size(false, true, 50, 50, 1, 10)).to.eql [50, 50]
    expect(get_size(false, true, 40, 50, 1, 10)).to.eql [50, 50]
    expect(get_size(false, true, 60, 50, 1, 10)).to.eql [50, 50]
    expect(get_size(false, true, 50, 50, 2, 10)).to.eql [100, 50]
    expect(get_size(false, true, 50, 50, 0.5, 10)).to.eql [25, 50]
  
  it "should scale well when using both width and height", ->
    expect(get_size(true, true, 50, 50, 1, 10)).to.eql [50, 50]
    expect(get_size(true, true, 40, 50, 1, 10)).to.eql [40, 40]
    expect(get_size(true, true, 60, 50, 1, 10)).to.eql [50, 50]
    expect(get_size(true, true, 50, 40, 1, 10)).to.eql [40, 40]
    expect(get_size(true, true, 50, 60, 1, 10)).to.eql [50, 50]
    
    expect(get_size(true, true, 50, 50, 2, 10)).to.eql [50, 25]
    expect(get_size(true, true, 50, 50, 0.5, 10)).to.eql [25, 50]
    
  it "should take min_size into account", ->
    expect(get_size(true, false, 10, 10, 1, 30)).to.eql [30, 30]
    expect(get_size(true, false, 10, 10, 2, 30)).to.eql [60, 30]
    expect(get_size(true, false, 10, 10, 0.5, 30)).to.eql [30, 60]
    
    expect(get_size(false, true, 10, 10, 1, 30)).to.eql [30, 30]
    expect(get_size(false, true, 10, 10, 2, 30)).to.eql [60, 30]
    expect(get_size(false, true, 10, 10, 0.5, 30)).to.eql [30, 60]
    
    expect(get_size(true, true, 10, 10, 1, 30)).to.eql [30, 30]
    expect(get_size(true, true, 10, 10, 2, 30)).to.eql [60, 30]
    expect(get_size(true, true, 10, 10, 0.5, 30)).to.eql [30, 60]
