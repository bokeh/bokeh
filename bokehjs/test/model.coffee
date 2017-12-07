{expect} = require "chai"
utils = require "./utils"
sinon = require "sinon"

{CustomJS} = utils.require("models/callbacks/customjs")
{Model} = utils.require("model")
p = utils.require "core/properties"

class SomeModel extends Model
  type: 'SomeModel'

  @define {
    foo: [ p.Number, 2 ]
    bar: [ p.String    ]
    baz: [ p.Number, 1 ]
  }

describe "Model objects", ->

  describe "default creation", ->
    m = new Model()

    it "should have null name", ->
      expect(m.name).to.be.null

    it "should have empty tags", ->
      expect(m.tags).to.be.deep.equal []

    it "should have empty js_property_callbacks", ->
      expect(m.js_property_callbacks).to.be.deep.equal {}

  describe "js callbacks", ->

    it "should execute on property changes", ->

      # unfortunately spy does not seem to have per-instance
      # resolution. This is the best test I could make work.

      cb1 = new CustomJS()
      cb2 = new CustomJS()
      cb3 = new CustomJS()

      spy = sinon.spy(cb3, 'execute')

      m = new SomeModel({
        js_property_callbacks: {
          'change:foo': [cb1, cb2]
          'change:bar': [cb3]
        }
      })

      # check the correct number of calls for m.foo change
      expect(spy.called).to.be.false
      m.foo = 10
      expect(spy.callCount).to.be.equal 0

      # check the correct number of calls for m.bar change
      spy.reset()
      expect(spy.called).to.be.false
      m.bar = "test"
      expect(spy.callCount).to.be.equal 1

      # check the correct number of calls for m.baz change
      spy.reset()
      expect(spy.called).to.be.false
      m.baz = 10
      expect(spy.callCount).to.be.equal 0
