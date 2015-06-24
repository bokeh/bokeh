{expect} = require "chai"
utils = require "../utils"

base = utils.require "common/base"
{Collections} = base

describe "callback module", ->

  describe "default creation", ->
    r = Collections('Callback').create()

    it "should have empty args", ->
      expect(r.get('args')).to.be.deep.equal {}

    it "should have empty code", ->
      expect(r.get('code')).to.be.equal ""

  describe "values property", ->
    rng = Collections('Range1d').create()
    r = Collections('Callback').create({args: {foo: rng.ref()}})

    it "should return resolved refs of args values", ->
      expect(r.get('values')).to.be.deep.equal [rng]

    it "should update when args changes", ->
      rng2 = Collections('Range1d').create()
      r.set('args', {foo: rng2.ref()})
      expect(r.get('values')).to.be.deep.equal [rng2]

  describe "func property", ->

    it "should return a Function", ->
      r = Collections('Callback').create()
      expect(r.get('func')).to.be.an.instanceof Function

    it "should have code property as function body", ->
      r = Collections('Callback').create({code: "return 10"})
      f = new Function("cb_obj", "cb_data", "return 10")
      expect(r.get('func').toString()).to.be.equal f.toString()

    it "should have values as function args", ->
      rng = Collections('Range1d').create()
      r = Collections('Callback').create({args: {foo: rng.ref()}, code: "return 10"})
      f = new Function("foo", "cb_obj", "cb_data", "return 10")
      expect(r.get('func').toString()).to.be.equal f.toString()

  describe "execute method", ->

    it "should execute the code and return the result", ->
       r = Collections('Callback').create({code: "return 10"})
       expect(r.execute()).to.be.equal 10

    it "should execute the code with args parameters passed", ->
      r = Collections('Callback').create({args: {foo: 5}, code: "return 10 + foo"})
      expect(r.execute()).to.be.equal 15

    it "should return the cb_obj passed an args parameter to execute", ->
      r = Collections('Callback').create({code: "return cb_obj"})
      expect(r.execute('foo')).to.be.equal 'foo'

    it "should return cb_data with value of null if cb_data kwarg is unset", ->
      r = Collections('Callback').create({code: "return cb_data"})
      expect(r.execute('foo')).to.be.equal undefined 

    it "should return cb_data with value of kwarg parameter to execute", ->
      r = Collections('Callback').create({code: "return cb_data"})
      expect(r.execute('foo', 'bar')).to.be.equal 'bar'
