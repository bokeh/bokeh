{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{CustomJS} = utils.require("models/callbacks/customjs")
{Range1d} = utils.require("models/ranges/range1d")

describe "range1d module", ->

  describe "default creation", ->
    r = new Range1d()

    it "should have start = 0", ->
      expect(r.start).to.be.equal 0

    it "should have end = 1", ->
      expect(r.end).to.be.equal 1

    it "should have min = 0", ->
      expect(r.min).to.be.equal 0

    it "should have max = 1", ->
      expect(r.max).to.be.equal 1

  describe "update start, less than end", ->
    r = new Range1d()
    r.start = -1

    it "should have min = -1", ->
      expect(r.min).to.be.equal -1

    it "should have max = 1", ->
      expect(r.max).to.be.equal 1

  describe "update start, greater than end", ->
    r = new Range1d()
    r.start = 2

    it "should have min = 1", ->
      expect(r.min).to.be.equal 1

    it "should have max = 2", ->
      expect(r.max).to.be.equal 2

  describe "update end, greater than start", ->
    r = new Range1d()
    r.end = 2

    it "should have min = 0", ->
      expect(r.min).to.be.equal 0

    it "should have max = 2", ->
      expect(r.max).to.be.equal 2

  describe "update end, less than start", ->
    r = new Range1d()
    r.end = -1.1

    it "should have min = -1.1", ->
      expect(r.min).to.be.equal -1.1

    it "should have max = 0", ->
      expect(r.max).to.be.equal 0

  describe "update both, positive", ->
    r = new Range1d()
    r.end = 1.1
    r.start = 2.1

    it "should have min = 1.1", ->
      expect(r.min).to.be.equal 1.1

    it "should have max = 2.1", ->
      expect(r.max).to.be.equal 2.1

  describe "update both, negative", ->
    r = new Range1d()
    r.end = -1.1
    r.start = -2.1

    it "should have min = -2.1", ->
      expect(r.min).to.be.equal -2.1

    it "should have max = -1.1", ->
      expect(r.max).to.be.equal -1.1

  describe "reset", ->

    it "should reset to initial values", ->
      r = new Range1d({start: 10, end: 20})
      r.end = -1.1
      r.start = -2.1
      r.reset()
      expect(r.start).to.be.equal 10
      expect(r.end).to.be.equal 20

    it "should execute update callback twice", ->
      cb = new CustomJS()
      r = new Range1d({callback: cb})
      spy = sinon.spy(cb, 'execute')
      r.start = -2.1
      r.reset()
      expect(spy.calledTwice).to.be.true

  describe "changing model attribute", ->

    it "should execute callback once", ->
      cb = new CustomJS()
      spy = sinon.spy(cb, 'execute')
      r = new Range1d({callback: cb})
      expect(spy.called).to.be.false
      r.start = 15
      expect(spy.calledOnce).to.be.true
