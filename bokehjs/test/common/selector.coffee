{expect} = require "chai"
utils = require "../utils"
fixtures = require "./fixtures/object"

base = utils.require "base"
{Selector} = utils.require "core/selector"
hittest = utils.require "core/hittest"

empty_selection = hittest.create_hit_test_result()
some_1d_selection = hittest.create_1d_hit_test_result([[0, 1], [1, 2]])
other_1d_selection = hittest.create_1d_hit_test_result([[4, 1], [5, 2]])

describe "Selector", ->

  it "should be constructable", ->
    s = new Selector()
    expect(s.indices).to.deep.equal empty_selection

  it "should be updatable", ->
    s = new Selector()
    s.update(some_1d_selection, true, false)
    expect(s.indices).not.to.deep.equal empty_selection

  it "should be updatable with append=false", ->
    s = new Selector()
    s.update(some_1d_selection, true, false)
    s.update(other_1d_selection, true, false)
    expect(s.indices['1d'].indices).to.be.deep.equal [4, 5]

  it "should be updatable with append=true", ->
    s = new Selector()
    s.update(some_1d_selection, true, true)
    s.update(other_1d_selection, true, true)
    expect(s.indices['1d'].indices).to.be.deep.equal [4, 5, 0, 1]

  it "should be clearable", ->
    s = new Selector()
    s.update(some_1d_selection, true, false)
    s.clear()
    expect(s.indices).to.deep.equal empty_selection
