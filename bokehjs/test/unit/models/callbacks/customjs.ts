import {expect} from "assertions"

import {CustomJS} from "@bokehjs/models/callbacks/customjs"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Document} from "@bokehjs/document"
import {version as js_version} from "@bokehjs/version"

describe("CustomJS", () => {

  describe("default constructor", () => {
    const r = new CustomJS()

    it("should have empty args", () => {
      expect(r.args).to.be.equal({})
    })

    it("should have empty code", () => {
      expect(r.code).to.be.equal("")
    })
  })

  describe("values property", () => {
    const rng = new Range1d()
    const r = new CustomJS({args: {foo: rng }})

    it("should contain the args values", () => {
      expect(r.values).to.be.equal([rng])
    })

    it("should round-trip through document serialization", () => {
      const d = new Document()
      d.add_root(r)
      const json = d.to_json_string()
      const parsed = JSON.parse(json)
      parsed.version = js_version
      const copy = Document.from_json_string(JSON.stringify(parsed))
      const r_copy = copy.get_model_by_id(r.id)! as CustomJS
      const rng_copy = copy.get_model_by_id(rng.id)! as CustomJS
      expect(r.values).to.be.equal([rng])
      expect(r_copy.values).to.be.equal([rng_copy])
    })

    it("should update when args changes", () => {
      const rng2 = new Range1d()
      r.args = {foo: rng2}
      expect(r.values).to.be.equal([rng2])
    })
  })

  describe("func property", () => {

    it("should return a Function", () => {
      const r = new CustomJS()
      expect(r.func).to.be.instanceof(Function)
    })

    it("should have code property as function body", () => {
      const r = new CustomJS({code: "return 10"})
      const f = new Function("cb_obj", "cb_data", "'use strict';\nreturn 10")
      expect(r.func.toString()).to.be.equal(f.toString())
    })

    it("should have values as function args", () => {
      const rng = new Range1d()
      const r = new CustomJS({args: {foo: rng.ref()}, code: "return 10"})
      const f = new Function("foo", "cb_obj", "cb_data", "'use strict';\nreturn 10")
      expect(r.func.toString()).to.be.equal(f.toString())
    })
  })

  describe("execute method", () => {

    it("should execute the code and return the result", () => {
      const r = new CustomJS({code: "return 10"})
      expect(r.execute('foo')).to.be.equal(10)
    })

    it("should execute the code with args parameters passed", () => {
      const r = new CustomJS({args: {foo: 5}, code: "return 10 + foo"})
      expect(r.execute('foo')).to.be.equal(15)
    })

    it("should return the cb_obj passed an args parameter to execute", () => {
      const r = new CustomJS({code: "return cb_obj"})
      expect(r.execute('foo')).to.be.equal('foo')
    })

    it("should return cb_data with default value if cb_data kwarg is unset", () => {
      const r = new CustomJS({code: "return cb_data"})
      expect(r.execute('foo')).to.be.equal({})
    })

    it("should return cb_data with value of kwarg parameter to execute", () => {
      const r = new CustomJS({code: "return cb_data.foo"})
      expect(r.execute('foo', {foo: 'bar'})).to.be.equal('bar')
    })

    it("should execute the code with args parameters correctly mapped", () => {
      // the point of this test is that we shouldn't be relying on
      // the definition order of keys in a JS object, though it
      // is reliable in some JS runtimes
      const r = new CustomJS({args: {
        foo4: "foo4", foo5: "foo5", foo6: "foo6",
        foo1: "foo1", foo2: "foo2", foo3: "foo3",
      }, code: "return foo1 + foo2 + foo3 + foo4 + foo5 + foo6"})
      expect(r.execute({})).to.be.equal("foo1foo2foo3foo4foo5foo6")
    })
  })
})
