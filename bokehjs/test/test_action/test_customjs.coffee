{expect} = require "chai"
utils = require "../utils"

base = utils.require "common/base"
{Collections} = base
{Document} = utils.require "common/document"

describe "customjs module", ->

  describe "default creation", ->
    r = Collections('CustomJS').create()

    it "should have empty args", ->
      expect(r.get('args')).to.be.deep.equal {}

    it "should have empty code", ->
      expect(r.get('code')).to.be.equal ""

  describe "values property", ->
    rng = Collections('Range1d').create()
    r = Collections('CustomJS').create({args: {foo: rng }})

    it "should contain the args values", ->
      expect(r.get('values')).to.be.deep.equal [rng]

    it "should round-trip through document serialization", ->
      d = new Document()
      d.add_root(r)
      json = d.to_json_string()
      copy = Document.from_json_string(json)
      r_copy = copy.get_model_by_id(r.id)
      rng_copy = copy.get_model_by_id(rng.id)
      expect(r.get('values')).to.be.deep.equal [rng]
      expect(r_copy.get('values')).to.be.deep.equal [rng_copy]

    it "should update when args changes", ->
      rng2 = Collections('Range1d').create()
      r.set('args', {foo: rng2 })
      expect(r.get('values')).to.be.deep.equal [rng2]

  describe "func property", ->

    it "should return a Function", ->
      r = Collections('CustomJS').create()
      expect(r.get('func')).to.be.an.instanceof Function

    it "should have code property as function body", ->
      r = Collections('CustomJS').create({code: "return 10"})
      f = new Function("cb_obj", "cb_data", "require", "return 10")
      expect(r.get('func').toString()).to.be.equal f.toString()

    it "should have values as function args", ->
      rng = Collections('Range1d').create()
      r = Collections('CustomJS').create({args: {foo: rng.ref()}, code: "return 10"})
      f = new Function("foo", "cb_obj", "cb_data", "require", "return 10")
      expect(r.get('func').toString()).to.be.equal f.toString()

  describe "execute method", ->

    it "should execute the code and return the result", ->
       r = Collections('CustomJS').create({code: "return 10"})
       expect(r.execute()).to.be.equal 10

    it "should execute the code with args parameters passed", ->
      r = Collections('CustomJS').create({args: {foo: 5}, code: "return 10 + foo"})
      expect(r.execute()).to.be.equal 15

    it "should return the cb_obj passed an args parameter to execute", ->
      r = Collections('CustomJS').create({code: "return cb_obj"})
      expect(r.execute('foo')).to.be.equal 'foo'

    it "should return cb_data with value of null if cb_data kwarg is unset", ->
      r = Collections('CustomJS').create({code: "return cb_data"})
      expect(r.execute('foo')).to.be.equal undefined

    it "should return cb_data with value of kwarg parameter to execute", ->
      r = Collections('CustomJS').create({code: "return cb_data"})
      expect(r.execute('foo', 'bar')).to.be.equal 'bar'

    it "should execute the code with args parameters correctly mapped", ->
      # the point of this test is that we shouldn't be relying on
      # the definition order of keys in a JS object, though it
      # is reliable in some JS runtimes
      r = Collections('CustomJS').create({args: {
          foo4: "foo4", foo5: "foo5", foo6: "foo6",
          foo1: "foo1", foo2: "foo2", foo3: "foo3"
        }, code: "return foo1 + foo2 + foo3 + foo4 + foo5 + foo6"})
      expect(r.execute()).to.be.equal "foo1foo2foo3foo4foo5foo6"
