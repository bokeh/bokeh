import {expect} from "assertions"

import {HasProps} from "@bokehjs/core/has_props"
import {Serializer} from "@bokehjs/core/serializer"
import {Document} from "@bokehjs/document/document"
import * as events from "@bokehjs/document/events"

const EVENTS = [
//  "ColumnDataChangedEvent", // Not implemented yet
  "ColumnsPatchedEvent",
  "ColumnsStreamedEvent",
  "DocumentChangedEvent",
  "MessageSentEvent",
  "ModelChangedEvent",
  "TitleChangedEvent",
  "RootAddedEvent",
  "RootRemovedEvent",
]

class TestModel extends HasProps {}

class TestModelWithRefs extends HasProps {
  foo: number[]

  static init_TestModelWithRefs(): void {
    this.define<any>(({Number, Array}) => ({
      foo: [ Array(Number), [] ],
    }))
  }
}

describe("events module", () => {

  describe("exports", () => {

    for (const event of EVENTS) {
      it(`"should have ${event}"`, () => {
        expect(event in events).to.be.true
      })
    }
  })

  describe("ColumnsPatchedEvent", () => {
    it("should generate json", () => {
      const d = new Document()
      const m = new TestModel()
      const event = new events.ColumnsPatchedEvent(d, m.ref(), {foo: [[1, 2]]})
      const serializer = new Serializer()
      const result = serializer.to_serializable(event)
      expect(result).to.be.equal({
        kind: "ColumnsPatched",
        column_source: m.ref(),
        patches: {foo: [[1, 2]]},
      })
    })
  })

  describe("ColumnsStreamedEvent", () => {
    it("should generate json with rollover", () => {
      const d = new Document()
      const m = new TestModel()
      const event = new events.ColumnsStreamedEvent(d, m.ref(), {foo: [1, 2], bar: [3, 4]}, 10)
      const serializer = new Serializer()
      const result = serializer.to_serializable(event)
      expect(result).to.be.equal({
        kind: "ColumnsStreamed",
        column_source: m.ref(),
        data: {foo: [1, 2], bar: [3, 4]},
        rollover: 10,
      })
    })

    it("should generate json without rollover", () => {
      const d = new Document()
      const m = new TestModel()
      const event = new events.ColumnsStreamedEvent(d, m.ref(), {foo: [1, 2], bar: [3, 4]})
      const serializer = new Serializer()
      const result = serializer.to_serializable(event)
      expect(result).to.be.equal({
        kind: "ColumnsStreamed",
        column_source: m.ref(),
        data: {foo: [1, 2], bar: [3, 4]},
        rollover: undefined,
      })
    })
  })

  describe("ModelChangedEvent", () => {
    it("should generating json with no references", () =>{
      const d = new Document()
      const m = new TestModel()
      const event = new events.ModelChangedEvent(d, m, "foo", 1, 2)
      const serializer = new Serializer()
      const result = serializer.to_serializable(event)
      expect(result).to.be.equal({
        kind: "ModelChanged",
        model: m.ref(),
        attr: "foo",
        new: 2,
      })
    })

    it("should generating json with references", () =>{
      const d = new Document()
      const m = new TestModel()
      const m2 = new TestModelWithRefs({foo: []})
      const event = new events.ModelChangedEvent(d, m2, "foo", [], [m])
      const serializer = new Serializer()
      const result = serializer.to_serializable(event)
      expect(result).to.be.equal({
        kind: "ModelChanged",
        model: m2.ref(),
        attr: "foo",
        new: [m.ref()],
      })
      const expected_refs = new Set([m])
      expect(serializer.objects).to.be.equal(expected_refs)
    })

    // TODO (bev) test the case with references returned

    it("should delegate generating json to a hint", () =>{
      const d = new Document()
      const m = new TestModel()
      const hint = new events.ColumnsStreamedEvent(d, m.ref(), {foo: [1, 2], bar: [3, 4]})
      const event = new events.ModelChangedEvent(d, m, "foo", 1, 2, undefined, hint)
      const serializer = new Serializer()
      const result = serializer.to_serializable(event)
      expect(result).to.be.equal({
        kind: "ColumnsStreamed",
        column_source: m.ref(),
        data: {foo: [1, 2], bar: [3, 4]},
        rollover: undefined,
      })
    })
  })

  describe("TitleChangedEvent", () => {
    it("should generate json", () => {
      const d = new Document()
      const event = new events.TitleChangedEvent(d, "foo")
      const serializer = new Serializer()
      const result = serializer.to_serializable(event)
      expect(result).to.be.equal({
        kind: "TitleChanged",
        title: "foo",
      })
    })
  })

  describe("RootAddedEvent", () => {
    it("should generate json", () => {
      const d = new Document()
      const m = new TestModel()
      const event = new events.RootAddedEvent(d, m)
      const serializer = new Serializer()
      const result = serializer.to_serializable(event)
      expect(result).to.be.equal({
        kind: "RootAdded",
        model: m.ref(),
      })
    })
  })

  describe("RootRemovedEvent", () => {
    it("should generate json", () => {
      const d = new Document()
      const m = new TestModel()
      const event = new events.RootRemovedEvent(d, m)
      const serializer = new Serializer()
      const result = serializer.to_serializable(event)
      expect(result).to.be.equal({
        kind: "RootRemoved",
        model: m.ref(),
      })
    })
  })
})
