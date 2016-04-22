{expect} = require "chai"
utils = require "../utils"
fixtures = require "./fixtures/object"

base = utils.require "base"
Selector = utils.require "common/selector"
hittest = utils.require "common/hittest"

empty_selection = hittest.create_hit_test_result()

describe "Selector", ->

  it "should be constructable", ->
    s = new Selector()
    expect(s.get('indices')).to.deep.equal empty_selection

  it "should be updatable", ->

  it "should be clearable", ->
    s = new Selector()

    s.clear()
    expect(s.get('indices')).to.deep.equal empty_selection
