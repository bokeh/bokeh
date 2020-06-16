import {expect} from "assertions"
import * as sinon from "sinon"

import {CustomJS} from "@bokehjs/models/callbacks/customjs"
import {Model} from "@bokehjs/model"
import * as p from "@bokehjs/core/properties"

class SomeModel extends Model {

  foo: number
  bar: string
  baz: number

  static init_SomeModel(): void {
    this.define<any>({
      foo: [ p.Number, 2 ],
      bar: [ p.String    ],
      baz: [ p.Number, 1 ],
    })
  }
}

describe("Model objects", () => {

  describe("default creation", () => {
    const m = new SomeModel()

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

      const spy = sinon.spy(cb3, 'execute')

      const m = new SomeModel({
        js_property_callbacks: {
          'change:foo': [cb1, cb2],
          'change:bar': [cb3],
        },
      })

      // check the correct number of calls for m.foo change
      expect(spy.called).to.be.false
      m.foo = 10
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
})
