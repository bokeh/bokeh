import * as sinon from "sinon"
import {expect, expect_instanceof} from "assertions"

import {CustomJS} from "@bokehjs/models/callbacks/customjs"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {GeneratorFunction, AsyncGeneratorFunction} from "@bokehjs/core/types"
import {logger} from "@bokehjs/core/logging"
import {Document} from "@bokehjs/document"
import {version as js_version} from "@bokehjs/version"

describe("CustomJS", () => {

  describe("args property", () => {

    it("should round-trip through document serialization", () => {
      const rng = new Range1d()
      const cb = new CustomJS({code: "return 10", args: {rng}})

      const d = new Document()
      d.add_root(cb)

      const json = d.to_json_string()
      const parsed = JSON.parse(json)
      parsed.version = js_version

      const copy = Document.from_json_string(JSON.stringify(parsed))

      const cb_copy = copy.get_model_by_id(cb.id)
      expect_instanceof(cb_copy, CustomJS)

      const rng_copy = copy.get_model_by_id(rng.id)
      expect_instanceof(rng_copy, Range1d)

      expect(cb.args).to.be.equal({rng})
      expect(cb_copy.args).to.be.equal({rng: rng_copy})
    })
  })

  describe("state property", () => {

    it("should support JS code", async () => {
      const cb = new CustomJS({code: "return 10"})
      const {func, module} = await cb.state()
      expect(func).to.be.instanceof(Function)
      const repr = func.toString().replaceAll(/\s*\n\s*/g, " ") // representation depends on bundling, etc.
      expect(repr).to.be.equal("function (...args) { return func.call(this, ...values, ...args); }")
      expect(module).to.be.equal(false)
    })

    it("should support ES module with a default function", async () => {
      const cb = new CustomJS({code: "export default function(args, obj, data) { return 10 }"})
      const {func, module} = await cb.state()
      expect(func).to.be.instanceof(Function)
      expect(func.toString()).to.be.equal("function(args, obj, data) { return 10 }")
      expect(module).to.be.equal(true)
    })

    it("should support ES module with a default arrow function", async () => {
      const cb = new CustomJS({code: "export default (args, obj, data) => 10"})
      const {func, module} = await cb.state()
      expect(func).to.be.instanceof(Function)
      expect(func.toString()).to.be.equal("(args, obj, data) => 10")
      expect(module).to.be.equal(true)
    })

    it("should support ES module with a default async function", async () => {
      const cb = new CustomJS({code: "export default async function(args, obj, data) { return 10 }"})
      const {func, module} = await cb.state()
      expect(func).to.be.instanceof(Function)
      expect(func.toString()).to.be.equal("async function(args, obj, data) { return 10 }")
      expect(module).to.be.equal(true)
    })

    it("should support ES module with a default async arrow function", async () => {
      const cb = new CustomJS({code: "export default async (args, obj, data) => 10"})
      const {func, module} = await cb.state()
      expect(func).to.be.instanceof(Function)
      expect(func.toString()).to.be.equal("async (args, obj, data) => 10")
      expect(module).to.be.equal(true)
    })

    it("should support ES module with a default generator function", async () => {
      const cb = new CustomJS({code: "export default function*(args, obj, data) { yield 5; return 10 }"})
      const {func, module} = await cb.state()
      expect(func).to.be.instanceof(GeneratorFunction)
      expect(func.toString()).to.be.equal("function*(args, obj, data) { yield 5; return 10 }")
      expect(module).to.be.equal(true)
    })

    it("should support ES module with a default async generator function", async () => {
      const cb = new CustomJS({code: "export default async function*(args, obj, data) { yield 5; return 10 }"})
      const {func, module} = await cb.state()
      expect(func).to.be.instanceof(AsyncGeneratorFunction)
      expect(func.toString()).to.be.equal("async function*(args, obj, data) { yield 5; return 10 }")
      expect(module).to.be.equal(true)
    })

    it("should support ES module bad default export", async () => {
      const cb = new CustomJS({code: "const some = 10;\nexport default some"})
      const logger_spy = sinon.spy(logger, "warn")
      try {
        const {func, module} = await cb.state()
        expect(func).to.be.instanceof(Function)
        expect(func.toString()).to.be.equal("() => undefined")
        expect(module).to.be.equal(true)
        expect(logger_spy.calledOnceWith("custom ES module didn't export a default function"))
      } finally {
        logger_spy.restore()
      }
    })
  })

  describe("execute method", () => {

    it("should execute the code and return the result", async () => {
      const cb = new CustomJS({code: "return 10"})
      const obj = new Range1d({start: 1, end: 2})
      expect(await cb.execute(obj)).to.be.equal(10)
    })

    it("should execute the code with args parameters passed", async () => {
      const cb = new CustomJS({args: {foo: 5}, code: "return 10 + foo"})
      const obj = new Range1d({start: 1, end: 2})
      expect(await cb.execute(obj)).to.be.equal(15)
    })

    it("should return the cb_obj passed an args parameter to execute", async () => {
      const cb = new CustomJS({code: "return cb_obj"})
      const obj = new Range1d({start: 1, end: 2})
      expect(await cb.execute(obj)).to.be.equal(obj)
    })

    it("should return cb_data with default value if cb_data kwarg is unset", async () => {
      const cb = new CustomJS({code: "return cb_data"})
      const obj = new Range1d({start: 1, end: 2})
      expect(await cb.execute(obj)).to.be.equal({})
    })

    it("should return cb_data with value of kwarg parameter to execute", async () => {
      const cb = new CustomJS({code: "return cb_data.foo"})
      const obj = new Range1d({start: 1, end: 2})
      expect(await cb.execute(obj, {foo: "bar"})).to.be.equal("bar")
    })

    it("should execute the code with args parameters correctly mapped", async () => {
      // The point of this test is that we shouldn't be relying on the definition
      // order of keys in a JS object, though it is reliable in some JS runtimes.
      const cb = new CustomJS({
        args: {
          foo4: "foo4",
          foo5: "foo5",
          foo6: "foo6",
          foo1: "foo1",
          foo2: "foo2",
          foo3: "foo3",
        },
        code: "return [foo1, foo2, foo3, foo4, foo5, foo6]",
      })
      const obj = new Range1d({start: 1, end: 2})
      expect(await cb.execute(obj)).to.be.equal(["foo1", "foo2", "foo3", "foo4", "foo5", "foo6"])
    })
  })
})
