{expect} = require "chai"
utils = require "../utils"

base = utils.require "common/base"
{Collections} = base

describe "datarange1d module", ->

  describe "default creation", ->
    r = Collections('DataRange1d').create()

    it "should have start = 10", ->
      expect(r.get('start')).to.be.equal 0

    it "should have end = 1", ->
      expect(r.get('end')).to.be.equal 1

    it "should have min = 0", ->
      expect(r.get('min')).to.be.equal 0

    it "should have max = 1", ->
      expect(r.get('max')).to.be.equal 1

  describe "explicit bounds=(10,20) creation", ->
    r = Collections('DataRange1d').create({start: 10, end:20})

    it "should have start = 10", ->
      expect(r.get('start')).to.be.equal 10

    it "should have end = 20", ->
      expect(r.get('end')).to.be.equal 20

    it "should have min = 10", ->
      expect(r.get('min')).to.be.equal 10

    it "should have max = 20", ->
      expect(r.get('max')).to.be.equal 20
