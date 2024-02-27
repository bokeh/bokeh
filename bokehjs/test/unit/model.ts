import {expect} from "assertions"
import * as sinon from "sinon"

import {CustomJS} from "@bokehjs/models/callbacks/customjs"
import {Model} from "@bokehjs/model"
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
    const m = new Some0Model()

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

    it("should execute on property changes", () => {
      // unfortunately spy does not seem to have per-instance
      // resolution. This is the best test I could make work.

      const cb1 = new CustomJS()
      const cb2 = new CustomJS()
      const cb3 = new CustomJS()

      const spy = sinon.spy(cb3, "execute")

      const m = new Some0Model({
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
    const some0_0 = new Some0Model({name: "some0"})
    const some0_1 = new Some0Model({name: "some1"})
    const some1_0 = new Some1Model({p3: [some0_0]})
    const some1_1 = new Some1Model({p3: [some1_0, some0_1]})

    expect(some1_1.select({type: "Some0Model"})).to.be.equal([some0_0, some0_1])
    expect(() => some1_1.select_one({type: "Some0Model"})).to.throw(Error, "found multiple objects matching the given selector")
  })
})
