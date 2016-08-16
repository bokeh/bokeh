{expect} = require "chai"
utils = require "../../utils"

FuncTickFormatter = utils.require("models/formatters/func_tick_formatter").Model
Range1d = utils.require("models/ranges/range1d").Model

describe "func_tick_formatter module", ->

  describe "values computed property", ->
    rng1 = new Range1d()
    formatter = new FuncTickFormatter({
      args: {foo: rng1}
      code: "function(tick) {return 5};"
    })

    it "should contain the args values", ->
      expect(formatter.get('values')).to.be.deep.equal([rng1])

    it "should update when args changes", ->
      rng2 = new Range1d()
      formatter.set('args', {foo: rng2})

      expect(formatter.get('values')).to.be.deep.equal([rng2])

  describe "func computed property", ->
    it "should return a Function", ->
      formatter = new FuncTickFormatter({
        code: "function(tick) {return 5};";
      })
      expect(formatter.get('func')).to.be.an.instanceof Function

    it "should have code property as function body", ->
      r = new FuncTickFormatter({args: {}, code: "function(tick) {return 10};"})
      f = new Function("tick", "var func = " + "function(tick) {return 10};" + "return func(tick)")
      expect(r.get('func').toString()).to.be.equal f.toString()

    it "should have values as function args", ->
      rng = new Range1d()
      r = new FuncTickFormatter({args: {foo: rng.ref()}, code: "function(tick) {return 10};"})
      f = new Function("tick", "foo", "var func = " + "function(tick) {return 10};" + "return func(tick)")
      expect(r.get('func').toString()).to.be.equal f.toString()

  describe "doFormat method", ->

    it "should format numerical ticks appropriately", ->
      obj = new FuncTickFormatter
        code: "function (x) {return x*10};"

      labels = obj.doFormat([-10, -0.1, 0, 0.1, 10])
      expect(labels).to.deep.equal([-100, -1.0, 0, 1, 100])

    it "should format categorical ticks appropriately", ->
      obj = new FuncTickFormatter
        code: "function (y) {return y + '_lat'};"

      labels = obj.doFormat(["a", "b", "c", "d", "e"])
      expect(labels).to.deep.equal(["a_lat", "b_lat", "c_lat", "d_lat", "e_lat"])

    it "should handle args appropriately", ->
      rng = new Range1d({start: 5, end: 10})

      # checks that args doesn't cause undeclared var error
      obj = new FuncTickFormatter
        code: "function (x) {return foo.get('start') + foo.get('end') + x};"
        args: {foo: rng}

      labels = obj.doFormat([-10, -0.1, 0, 0.1, 10])
      expect(labels).to.deep.equal([5, 14.9, 15, 15.1, 25])
