import {expect, expect_instanceof} from "assertions"

import {CustomJSHover} from "@bokehjs/models/tools/inspectors/customjs_hover"

import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Document} from "@bokehjs/document"
import {version as js_version} from "@bokehjs/version"

describe("CustomJSHover", () => {

  describe("default constructor", () => {
    const customjs_hover = new CustomJSHover()

    it("should have empty args", () => {
      expect(customjs_hover.args).to.be.equal({})
    })

    it("should have empty code", () => {
      expect(customjs_hover.code).to.be.equal("")
    })
  })

  describe("values property", () => {
    const range = new Range1d()
    const customjs_hover = new CustomJSHover({args: {foo: range}})

    it("should contain the args values", () => {
      expect(customjs_hover.values).to.be.equal([range])
    })

    it("should round-trip through document serialization", () => {
      const d = new Document()
      d.add_root(customjs_hover)
      const json = d.to_json_string()
      const parsed = JSON.parse(json)
      parsed.version = js_version
      const copy = Document.from_json_string(JSON.stringify(parsed))
      const customjs_hover_copy = copy.get_model_by_id(customjs_hover.id)
      const range_copy = copy.get_model_by_id(range.id)
      expect_instanceof(customjs_hover_copy, CustomJSHover)
      expect_instanceof(range_copy, Range1d)
      expect(customjs_hover.values).to.be.equal([range])
      expect(customjs_hover_copy.values).to.be.equal([range_copy])
    })

    it("should update when args changes", () => {
      const rng2 = new Range1d()
      customjs_hover.args = {foo: rng2}
      expect(customjs_hover.values).to.be.equal([rng2])
    })
  })

  describe("_make_code method", () => {

    it("should return a Function", () => {
      const r = new CustomJSHover()
      expect(r._make_code("value", "format", "special_vars", r.code)).to.be.instanceof(Function)
    })

    it("should have formatter property as function body", () => {
      const r = new CustomJSHover({code: "return 10"})
      const f = new Function("value", "format", "special_vars", "'use strict';\nreturn 10")
      const formatter = r._make_code("value", "format", "special_vars", r.code)
      expect(formatter.toString()).to.be.equal(f.toString())
    })

    it("should have values as function args", () => {
      const rng = new Range1d()
      const r = new CustomJSHover({args: {foo: rng.ref()}, code: "return 10"})
      const f = new Function("foo", "value", "format", "special_vars", "'use strict';\nreturn 10")
      const formatter = r._make_code("value", "format", "special_vars", r.code)
      expect(formatter.toString()).to.be.equal(f.toString())
    })
  })

  describe("format method", () => {

    it("should execute the code and return the result", () => {
      const r = new CustomJSHover({code: "return format + ' ' + value + ' ' + 10"})
      expect(r.format(0, "custom", {})).to.be.equal("custom 0 10")
    })

    it("should execute the code with args parameters passed", () => {
      const r = new CustomJSHover({args: {foo: 5}, code: "return format + ' ' + value + ' ' + (10 + foo)"})
      expect(r.format(0, "custom", {})).to.be.equal("custom 0 15")
    })
  })
})
