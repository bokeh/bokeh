import {expect} from "#framework/assertions"
import * as sinon from "sinon"
import {restorable} from "#framework/util"

import {CustomJS} from "@bokehjs/models/callbacks/customjs"
import {Model} from "@bokehjs/model"
import {logger} from "@bokehjs/core/logging"
import {dict} from "@bokehjs/core/util/object"
import {Document} from "@bokehjs/document"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {Select} from "@bokehjs/models/widgets/select"
import type * as p from "@bokehjs/core/properties"

namespace Some0Model {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    foo: p.Property<boolean>
    bar: p.Property<string>
    baz: p.Property<number>
  }
}
interface Some0Model extends Some0Model.Attrs {}
class Some0Model extends Model {
  declare properties: Some0Model.Props
  constructor(attrs?: Partial<Some0Model.Attrs>) {
    super(attrs)
  }
  static {
    this.define<Some0Model.Props>(({Bool, Float, Str}) => ({
      foo: [ Bool, false ],
      bar: [ Str ],
      baz: [ Float, 1 ],
    }))
  }
}

namespace Some1Model {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    p0: p.Property<boolean>
    p1: p.Property<string>
    p2: p.Property<number>
    p3: p.Property<Model[] | null>
  }
}
interface Some1Model extends Some1Model.Attrs {}
class Some1Model extends Model {
  declare properties: Some1Model.Props
  constructor(attrs?: Partial<Some1Model.Attrs>) {
    super(attrs)
  }
  static {
    this.define<Some1Model.Props>(({Bool, Float, Str, List, Ref, Nullable}) => ({
      p0: [ Bool, false ],
      p1: [ Str, "foo" ],
      p2: [ Float, 1 ],
      p3: [ Nullable(List(Ref(Model))), null ],
    }))
  }
}

describe("Model objects", () => {

  describe("default creation", () => {
    const m = Some0Model.create()

    it("should have null name", () => {
      expect(m.name).to.be.null
    })

    it("should have empty tags", () => {
      expect(m.tags).to.be.equal([])
    })

    it("should have empty js_property_callbacks", () => {
      expect(m.js_property_callbacks).to.be.equal({})
    })
  })

  describe("js callbacks", () => {

    for (const event of ["missing", "select", "name", "change:missing", "change:select", "change:__proto__", "change:", "change:foo:extra"]) {
      it(`should warn and skip invalid signal '${event}' during creation`, () => {
        using warn = restorable(sinon.stub(logger, "warn"))
        const invalid = sinon.spy()
        const valid = sinon.spy()
        const changed = sinon.spy()
        const m = Some0Model.create({
          js_property_callbacks: {
            [event]: [invalid],
            "change:foo": [valid],
            change: [changed],
          },
        })

        expect(warn.calledOnce).to.be.true
        expect(warn.firstCall.args[0]).to.be.equal(`cannot connect JS callbacks for '${event}' on ${m}: not a signal`)
        m.foo = true
        expect(invalid.called).to.be.false
        expect(valid.calledOnce).to.be.true
        expect(changed.calledOnce).to.be.true
      })
    }

    it("should recover when invalid callbacks are replaced", () => {
      using warn = restorable(sinon.stub(logger, "warn"))
      const old = sinon.spy()
      const current = sinon.spy()
      const m = Some0Model.create({js_property_callbacks: {"change:foo": [old]}})

      m.js_property_callbacks = {"change:missing": [old], "change:foo": [current]}
      m.foo = true
      expect(warn.calledOnce).to.be.true
      expect(old.called).to.be.false
      expect(current.calledOnce).to.be.true

      m.js_property_callbacks = {"change:foo": [old]}
      m.foo = false
      expect(warn.calledOnce).to.be.true
      expect(old.calledOnce).to.be.true
      expect(current.calledOnce).to.be.true
    })

    it("should preserve streaming and patching signals", () => {
      const streaming = sinon.spy()
      const patching = sinon.spy()
      const source = ColumnDataSource.create({
        data: {x: [1]},
        js_property_callbacks: {streaming: [streaming], patching: [patching]},
      })
      source.stream({x: [2]})
      source.patch({x: [[0, 3]]})
      expect(streaming.calledOnce).to.be.true
      expect(patching.calledOnce).to.be.true
    })

    it("should deserialize a document with invalid callbacks and keep valid callbacks working", () => {
      using warn = restorable(sinon.stub(logger, "warn"))
      const callback = CustomJS.create({code: ""})
      const select = Select.create({
        options: ["a", "b"], value: "a",
        js_property_callbacks: {active: [callback], "change:value": [callback]},
      })
      const doc = new Document()
      doc.add_root(select)
      const copy = Document.from_json(doc._to_json(false, "minimal"))
      const recovered = copy.roots()[0] as Select
      const recovered_callback = dict(recovered.js_property_callbacks).get("change:value")![0] as CustomJS
      const executed = sinon.spy(recovered_callback, "execute")

      expect(warn.callCount).to.be.equal(2)
      recovered.value = "b"
      expect(executed.calledOnce).to.be.true
    })

    it("should execute on property changes", () => {
      // unfortunately spy does not seem to have per-instance
      // resolution. This is the best test I could make work.

      const cb1 = CustomJS.create({code: ""})
      const cb2 = CustomJS.create({code: ""})
      const cb3 = CustomJS.create({code: ""})

      const spy = sinon.spy(cb3, "execute")

      const m = Some0Model.create({
        js_property_callbacks: {
          "change:foo": [cb1, cb2],
          "change:bar": [cb3],
        },
      })

      // check the correct number of calls for m.foo change
      expect(spy.called).to.be.false
      m.foo = true
      expect(spy.callCount).to.be.equal(0)

      // check the correct number of calls for m.bar change
      spy.resetHistory()
      expect(spy.called).to.be.false
      m.bar = "test"
      expect(spy.callCount).to.be.equal(1)

      // check the correct number of calls for m.baz change
      spy.resetHistory()
      expect(spy.called).to.be.false
      m.baz = 10
      expect(spy.callCount).to.be.equal(0)
    })
  })

  it("should support select() and select_one() methods", () => {
    const some0_0 = Some0Model.create({name: "some0"})
    const some0_1 = Some0Model.create({name: "some1"})
    const some1_0 = Some1Model.create({p3: [some0_0]})
    const some1_1 = Some1Model.create({p3: [some1_0, some0_1]})

    expect(some1_1.select({type: "Some0Model"})).to.be.equal([some0_0, some0_1])
    expect(() => some1_1.select_one({type: "Some0Model"})).to.throw(Error, "found multiple objects matching the given selector")
  })
})
