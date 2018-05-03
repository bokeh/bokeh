{expect} = require "chai"
utils = require "../../../utils"

{CustomJSHover} = utils.require("models/tools/inspectors/customjs_hover")

{Range1d} = utils.require("models/ranges/range1d")
{Document} = utils.require "document"
js_version = utils.require("version").version

describe "customjs module", ->

  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()

  beforeEach ->
    utils.stub_canvas()
    utils.stub_solver()

  describe "default creation", ->
    r = new CustomJSHover()

    it "should have empty args", ->
      expect(r.args).to.be.deep.equal {}

    it "should have empty formatter", ->
      expect(r.formatter).to.be.equal ""

  describe "values property", ->
    rng = new Range1d()
    r = new CustomJSHover({args: {foo: rng }})

    it "should contain the args values", ->
      expect(r.values).to.be.deep.equal [rng]

    it "should round-trip through document serialization", ->
      d = new Document()
      d.add_root(r)
      json = d.to_json_string()
      parsed = JSON.parse(json)
      parsed['version'] = js_version
      copy = Document.from_json_string(JSON.stringify(parsed))
      r_copy = copy.get_model_by_id(r.id)
      rng_copy = copy.get_model_by_id(rng.id)
      expect(r.values).to.be.deep.equal [rng]
      expect(r_copy.values).to.be.deep.equal [rng_copy]

    it "should update when args changes", ->
      rng2 = new Range1d()
      r.args = {foo: rng2 }
      expect(r.values).to.be.deep.equal [rng2]

  describe "_make_formatter method", ->

    it "should return a Function", ->
      r = new CustomJSHover()
      expect(r._make_formatter("value", "format", "special_vars", r.formatter)).to.be.an.instanceof Function

    it "should have formatter property as function body", ->
      r = new CustomJSHover({formatter: "return 10"})
      f = new Function("value", "format", "special_vars", "require", "exports", "'use strict';\nreturn 10")
      formatter = r._make_formatter("value", "format", "special_vars", r.formatter)
      expect(formatter.toString()).to.be.equal f.toString()

    it "should have values as function args", ->
      rng = new Range1d()
      r = new CustomJSHover({args: {foo: rng.ref()}, formatter: "return 10"})
      f = new Function("foo", "value", "format", "special_vars", "require", "exports", "'use strict';\nreturn 10")
      formatter = r._make_formatter("value", "format", "special_vars", r.formatter)
      expect(formatter.toString()).to.be.equal f.toString()

  describe "format method", ->

    it "should execute the code and return the result", ->
       r = new CustomJSHover({formatter: "return format + ' ' + value + ' ' + 10"})
       expect(r.format(0, "custom", {})).to.be.equal "custom 0 10"

    it "should execute the code with args parameters passed", ->
      r = new CustomJSHover({args: {foo: 5}, formatter: "return format + ' ' + value + ' ' + (10 + foo)"})
      expect(r.format(0, "custom", {})).to.be.equal "custom 0 15"
