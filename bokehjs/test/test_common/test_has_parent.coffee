{expect} = require "chai"
utils = require "../utils"
fixtures = require "./test_parent"

base = utils.require "common/base"
{Collections} = base

describe "has_parent module", ->
  before ->
    base.locations['TestParent'] = fixtures
  after ->
    base.locations['TestParent'] = undefined

  it "should have parent settings that propagate", ->
    fixtures.Collection.reset()
    parent = Collections('TestParent').create
      id: 'parent'
      testprop: 'aassddff'
    child = Collections('TestParent').create
      id: 'first'
      parent: parent.ref()

    expect(parent.get "testprop").to.equal("aassddff")
    expect(parent.get "testprop").to.equal(child.get "testprop")

  it "should propagate display_defaults if not overridden", ->
    fixtures.Collection.reset()
    parent = Collections("TestParent").create
      id: "parent"
    child = Collections("TestParent").create
      id: "child"
      parent: parent.ref()

    expect(parent.get "testprop").to.equal("defaulttestprop")
    expect(parent.get "testprop").to.equal(child.get "testprop")
