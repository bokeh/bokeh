{expect} = require "chai"
utils = require "../utils"
fixtures = require "./fixtures/object"

base = utils.require "base"
Selector = utils.require "core/selector"
hittest = utils.require "core/hittest"

empty_selection = hittest.create_hit_test_result()

describe "Selector", ->

  it "should be constructable", ->
    s = new Selector()
    expect(s.indices).to.deep.equal empty_selection

  it "should be updatable", ->

  it "should be clearable", ->
    s = new Selector()

    s.clear()
    expect(s.indices).to.deep.equal empty_selection
