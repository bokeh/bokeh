import {expect, expect_not_null} from "assertions"

import {Deserializer} from "@bokehjs/core/serialization/deserializer"
import type {ModelDef} from "@bokehjs/document/defs"
import {Model} from "@bokehjs/model"
import {default_resolver} from "@bokehjs/base"
import {ModelResolver} from "@bokehjs/core/resolvers"
import type * as p from "@bokehjs/core/properties"
import {ColumnDataSource} from "@bokehjs/models"

type int = number

declare namespace _Some0 {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    prop0: p.Property<any>
    prop1: p.Property<unknown>
    prop2: p.Property<boolean>
    prop3: p.Property<number>
    prop4: p.Property<int>
    prop5: p.Property<string>
    prop6: p.Property<null>
  }
}

declare interface _Some0 extends _Some0.Attrs {}

declare class _Some0 extends Model {
  declare properties: _Some0.Props
  constructor(attrs?: Partial<_Some0.Attrs>)
}

declare namespace _Some1 {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    prop0: p.Property<string>
    prop1: p.Property<int | null>
    prop2: p.Property<int | string>
    prop3: p.Property<[int, string]>
    prop4: p.Property<int[]>
    prop5: p.Property<[int, string][]>
    prop6: p.Property<{name0: int, name1: string}>
    prop7: p.Property<{[key: string]: int}>
    prop8: p.Property<Map<string[], int>>
    prop9: p.Property<"enum0" | "enum1" | "enum2">
  }
}

declare interface _Some1 extends _Some1.Attrs {}

declare class _Some1 extends Model {
  declare properties: _Some1.Props
  constructor(attrs?: Partial<_Some1.Attrs>)
}

declare namespace _Some2 {
  export type Attrs = p.AttrsOf<Props>

  export type Props = _Some1.Props & {
    prop10: p.Property<_Some0>
    prop11: p.Property<_Some0[]>
  }
}

declare interface _Some2 extends _Some2.Attrs {}

declare class _Some2 extends _Some1 {
  declare properties: _Some2.Props
  constructor(attrs?: Partial<_Some2.Attrs>)
}

declare namespace _Some3 {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ColumnDataSource.Props & {
    prop0: p.Property<int>
  }
}

declare interface _Some3 extends _Some3.Attrs {}

declare class _Some3 extends ColumnDataSource {
  declare properties: _Some3.Props
  constructor(attrs?: Partial<_Some3.Attrs>)
}

declare namespace _Some4 {
  export type Attrs = p.AttrsOf<Props>

  export type Props = _Some3.Props & {
    prop1: p.Property<int[]>
  }
}

declare interface _Some4 extends _Some4.Attrs {}

declare class _Some4 extends _Some3 {
  declare properties: _Some4.Props
  constructor(attrs?: Partial<_Some4.Attrs>)
}

describe("document/defs module", () => {
  describe("implements a deserializer", () => {
    it("that supports basic definitions", () => {
      const defs: ModelDef[] = [{
        type: "model",
        name: "some.Some0",
        extends: {id: "Model"},
        properties: [
          {name: "prop0", kind: "Any", default: 0},
          {name: "prop1", kind: "Unknown", default: 1},
          {name: "prop2", kind: "Boolean", default: true},
          {name: "prop3", kind: "Number", default: 1.23},
          {name: "prop4", kind: "Int", default: 123},
          {name: "prop5", kind: "String", default: "abc"},
          {name: "prop6", kind: "Null", default: null},
        ],
        overrides: [
          {name: "tags", default: ["some", "default", "tags"]},
        ],
      }, {
        type: "model",
        name: "some.Some1",
        properties: [
          {name: "prop0", kind: ["Regex", "^[a-z][a-z0-9]*"], default: "a0"},
          {name: "prop1", kind: ["Nullable", "Int"], default: null},
          {name: "prop2", kind: ["Or", "Int", "String"], default: 1},
          {name: "prop3", kind: ["Tuple", "Int", "String"], default: [1, "a"]},
          {name: "prop4", kind: ["Array", "Int"], default: [0, 1, 2]},
          {name: "prop5", kind: ["Array", ["Tuple", "Int", "String"]], default: [[0, "a"], [1, "b"], [2, "c"]]},
          {name: "prop6", kind: ["Struct", ["name0", "Int"], ["name1", "String"]], default: {name0: 0, name1: "a"}},
          {name: "prop7", kind: ["Dict", "Int"], default: {a: 0, b: 1, c: 2}},
          {name: "prop8", kind: ["Map", ["Array", "String"], "Int"], default: new Map([[["a", "a"], 0], [["b"], 1]])},
          {name: "prop9", kind: ["Enum", "enum0", "enum1", "enum2"], default: "enum2"},
        ],
      }, {
        type: "model",
        name: "some.Some2",
        extends: {id: "some.Some1"},
        properties: [{
          name: "prop10",
          kind: ["Ref", {id: "some.Some0"}],
          default: {type: "object", name: "some.Some0", id: "some001", attributes: {prop2: false, prop4: 128}},
        }, {
          name: "prop11",
          kind: ["Array", ["Ref", {id: "some.Some0"}]],
          default: [{id: "some001"}, {type: "object", name: "some.Some0", id: "some002", attributes: {prop2: false, prop4: 129}}],
        }],
        overrides: [
          {name: "prop2", default: "a"},
        ],
      }, {
        type: "model",
        name: "some.Some3",
        extends: {id: "ColumnDataSource"},
        properties: [
          {name: "prop0", kind: "Number", default: 1},
        ],
        overrides: [
          {name: "data", default: {default_column: [0, 1, 2]}},
        ],
      }, {
        type: "model",
        name: "some.Some4",
        extends: {id: "some.Some3"},
        properties: [
          {name: "prop1", kind: ["Array", "Number"], default: [0, 1, 2]},
        ],
        overrides: [
          {name: "data", default: {default_column: [3, 4, 5]}},
          {name: "prop0", default: 2},
        ],
      }]

      const resolver = new ModelResolver(default_resolver)
      const deserializer = new Deserializer(resolver)

      const models = deserializer.decode(defs) as (typeof Model)[]

      expect(models).to.be.instanceof(Array)
      expect(models.length).to.be.equal(5)

      const Some0 = resolver.get<typeof _Some0>("some.Some0")
      const Some1 = resolver.get<typeof _Some1>("some.Some1")
      const Some2 = resolver.get<typeof _Some2>("some.Some2")
      const Some3 = resolver.get<typeof _Some3>("some.Some3")
      const Some4 = resolver.get<typeof _Some4>("some.Some4")

      expect_not_null(Some0)
      expect_not_null(Some1)
      expect_not_null(Some2)
      expect_not_null(Some3)
      expect_not_null(Some4)

      expect(Some0.prototype).to.be.instanceof(Model)
      expect(Some1.prototype).to.be.instanceof(Model)
      expect(Some2.prototype).to.be.instanceof(Model)
      expect(Some2.prototype).to.be.instanceof(Some1)
      expect(Some3.prototype).to.be.instanceof(ColumnDataSource)
      expect(Some4.prototype).to.be.instanceof(ColumnDataSource)
      expect(Some4.prototype).to.be.instanceof(Some3)

      expect(Some0.__qualified__).to.be.equal("some.Some0")
      expect(Some1.__qualified__).to.be.equal("some.Some1")
      expect(Some2.__qualified__).to.be.equal("some.Some2")
      expect(Some3.__qualified__).to.be.equal("some.Some3")
      expect(Some4.__qualified__).to.be.equal("some.Some4")

      const some0 = new Some0()
      const some1 = new Some1()
      const some2 = new Some2()
      const some3 = new Some3()
      const some4 = new Some4()

      expect(some0).to.be.instanceof(Model)
      expect(some1).to.be.instanceof(Model)
      expect(some2).to.be.instanceof(Model)
      expect(some2).to.be.instanceof(Some1)
      expect(some3).to.be.instanceof(ColumnDataSource)
      expect(some4).to.be.instanceof(ColumnDataSource)
      expect(some4).to.be.instanceof(Some3)

      const model_props = [
        "tags",
        "name",
        "js_property_callbacks",
        "js_event_callbacks",
        "subscribed_events",
        "syncable",
      ]

      const cds_props = [
        "selected",
        "default_values",
        "selection_policy",
        "inspected",
        "data",
      ]

      expect([...some0].map((prop) => prop.attr)).to.be.equal([
        ...model_props,
        "prop0", "prop1", "prop2", "prop3", "prop4", "prop5", "prop6",
      ])
      expect([...some1].map((prop) => prop.attr)).to.be.equal([
        ...model_props,
        "prop0", "prop1", "prop2", "prop3", "prop4", "prop5", "prop6", "prop7", "prop8", "prop9",
      ])
      expect([...some2].map((prop) => prop.attr)).to.be.equal([
        ...model_props,
        "prop0", "prop1", "prop2", "prop3", "prop4", "prop5", "prop6", "prop7", "prop8", "prop9", "prop10", "prop11"])
      expect([...some3].map((prop) => prop.attr)).to.be.equal([
        ...model_props,
        ...cds_props,
        "prop0",
      ])
      expect([...some4].map((prop) => prop.attr)).to.be.equal([
        ...model_props,
        ...cds_props,
        "prop0", "prop1",
      ])

      expect(some0.prop0).to.be.equal(0)
      expect(some0.prop1).to.be.equal(1)
      expect(some0.prop2).to.be.equal(true)
      expect(some0.prop3).to.be.equal(1.23)
      expect(some0.prop4).to.be.equal(123)
      expect(some0.prop5).to.be.equal("abc")
      expect(some0.prop6).to.be.equal(null)

      expect(some0.tags).to.be.equal(["some", "default", "tags"])

      expect(some1.prop0).to.be.equal("a0")
      expect(some1.prop1).to.be.equal(null)
      expect(some1.prop2).to.be.equal(1)
      expect(some1.prop3).to.be.equal([1, "a"])
      expect(some1.prop4).to.be.equal([0, 1, 2])
      expect(some1.prop5).to.be.equal([[0, "a"], [1, "b"], [2, "c"]])
      expect(some1.prop6).to.be.equal({name0: 0, name1: "a"})
      expect(some1.prop7).to.be.equal({a: 0, b: 1, c: 2})
      expect(some1.prop8).to.be.structurally.equal(new Map([[["a", "a"], 0], [["b"], 1]]))
      expect(some1.prop9).to.be.equal("enum2")

      expect(some1.tags).to.be.equal([])

      expect(some2.prop0).to.be.equal("a0")
      expect(some2.prop1).to.be.equal(null)
      expect(some2.prop2).to.be.equal("a")
      expect(some2.prop3).to.be.equal([1, "a"])
      expect(some2.prop4).to.be.equal([0, 1, 2])
      expect(some2.prop5).to.be.equal([[0, "a"], [1, "b"], [2, "c"]])
      expect(some2.prop6).to.be.equal({name0: 0, name1: "a"})
      expect(some2.prop7).to.be.equal({a: 0, b: 1, c: 2})
      expect(some2.prop8).to.be.structurally.equal(new Map([[["a", "a"], 0], [["b"], 1]]))
      expect(some2.prop9).to.be.equal("enum2")

      const some001 = new Some0({prop2: false, prop4: 128})
      const some002 = new Some0({prop2: false, prop4: 129})
      expect(some2.prop10).to.be.structurally.equal(some001)
      expect(some2.prop11).to.be.structurally.equal([some001, some002])

      expect(some3.data).to.be.equal({default_column: [0, 1, 2]})
      expect(some3.prop0).to.be.equal(1)

      expect(some4.data).to.be.equal({default_column: [3, 4, 5]})
      expect(some4.prop0).to.be.equal(2)
      expect(some4.prop1).to.be.equal([0, 1, 2])
    })
  })
})
