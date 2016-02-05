{expect} = require "chai"
utils = require "../../utils"

cache = utils.require "core/util/cache"

describe "cache module", ->
  describe "exports", ->
    it "should have Cache", ->
      expect("Cache" of cache).to.be.true

  describe "Cache", ->
    it "should be zero size when created", ->
      c = new cache.Cache()
      expect(c.size()).to.be.equal 0

    describe "has", ->
      it "should report true when a key exists", ->
        c = new cache.Cache()
        c.add("foo", 10)
        expect(c.has("foo")).to.be.true

      it "should report false when a key does not exist", ->
        c = new cache.Cache()
        c.add("foo", 10)
        expect(c.has("bar")).to.be.false

    describe "get", ->
      it "should return the value for a key if it exists", ->
        c = new cache.Cache()
        c.add("foo", 10)
        expect(c.get("foo")).to.be.equal 10
        expect(c.get("foo"), 20).to.be.equal 10

      it "should return undefined or a default for a key if it does not exists", ->
        c = new cache.Cache()
        c.add("foo", 10)
        expect(c.get("bar")).to.be.undefined
        expect(c.get("bar", 10)).to.be.equal 10

    describe "add", ->
      it "should add or update a key and value", ->
        c = new cache.Cache()
        expect(c.has("foo")).to.be.false
        c.add("foo", 10)
        expect(c.has("foo")).to.be.true

    describe "clear", ->
      it "should clear a specified key", ->
        c = new cache.Cache()
        expect(c.has("foo")).to.be.false
        c.add("foo", 10)
        expect(c.has("foo")).to.be.true
        c.clear("foo")
        expect(c.has("foo")).to.be.false

      it "should clear all keys with no arguments", ->
        c = new cache.Cache()
        expect(c.has("foo")).to.be.false
        expect(c.has("bar")).to.be.false
        c.add("foo", 10)
        c.add("bar", 20)
        expect(c.has("foo")).to.be.true
        expect(c.has("bar")).to.be.true
        c.clear()
        expect(c.has("foo")).to.be.false
        expect(c.has("bar")).to.be.false

    describe "size", ->
      it "should report how many keys are stored", ->
      c = new cache.Cache()
      expect(c.size()).to.be.equal 0
      c.add("foo", 10)
      expect(c.size()).to.be.equal 1
      c.add("bar", 20)
      expect(c.size()).to.be.equal 2
      c.clear("bar")
      expect(c.size()).to.be.equal 1
      c.clear("bar")
      expect(c.size()).to.be.equal 1
      c.clear("foo")
      expect(c.size()).to.be.equal 0

