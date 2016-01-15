{expect} = require "chai"
utils = require "../utils"
fixtures = require "./fixtures/parent"

base = utils.require "common/base"
{Collections} = base

describe "has_parent module", ->
  before ->
    base.collection_overrides['TestParent'] = fixtures.Collection
  after ->
    base.collection_overrides['TestParent'] = undefined
  beforeEach ->
    fixtures.Collection.reset()

  it "should have parent settings that propagate", ->
    parent = Collections('TestParent').create
      id: 'parent'
      testprop: 'aassddff'
    child = Collections('TestParent').create
      id: 'first'
      parent: parent

    expect(parent.get "testprop").to.equal "aassddff"
    expect(parent.get "testprop").to.equal child.get("testprop")
