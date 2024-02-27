import {expect, expect_instanceof} from "assertions"

import {HasProps} from "@bokehjs/core/has_props"
import * as mixins from "@bokehjs/core/property_mixins"
import {Serializer} from "@bokehjs/core/serialization/serializer"
import {Deserializer} from "@bokehjs/core/serialization/deserializer"
import {ModelResolver} from "@bokehjs/core/resolvers"
import {default_resolver} from "@bokehjs/base"
import type * as p from "@bokehjs/core/properties"
import {keys} from "@bokehjs/core/util/object"

class EmptyModel extends HasProps {}

namespace TestModel {
  export type Attrs = p.AttrsOf<Props>
  export type Props = HasProps.Props & {
    p0: p.Property<number>
    p1: p.Property<string>
    p2: p.Property<TestModel | null>
    p3: p.Property<TestModel[]>
    p4: p.Property<Set<TestModel>>
    p5: p.Property<Map<TestModel, TestModel>>
    p6: p.Property<{foo: TestModel | null}>
  }
}
interface TestModel extends TestModel.Attrs {}
class TestModel extends HasProps {
  declare properties: TestModel.Props
  constructor(attrs?: Partial<TestModel.Attrs>) {
    super(attrs)
  }
  static {
    this.define<TestModel.Props>(({Float, Str, Nullable, Ref, List, Set, Mapping, Struct}) => ({
      p0: [ Float, 0 ],
      p1: [ Str, "abc" ],
      p2: [ Nullable(Ref(TestModel)), null ],
      p3: [ List(Ref(TestModel)), [] ],
      p4: [ Set(Ref(TestModel)), new globalThis.Set() ],
      p5: [ Mapping(Ref(TestModel), Ref(TestModel)), new Map() ],
      p6: [ Struct({foo: Nullable(Ref(TestModel))}), {foo: null} ],
    }))
  }
}

namespace SubclassWithProps {
  export type Attrs = p.AttrsOf<Props>
  export type Props = HasProps.Props & {
    foo: p.Property<number>
    bar: p.Property<boolean>
  }
}
interface SubclassWithProps extends SubclassWithProps.Attrs {}
class SubclassWithProps extends HasProps {
  declare properties: SubclassWithProps.Props
  constructor(attrs?: Partial<SubclassWithProps.Attrs>) {
    super(attrs)
  }
  static {
    this.define<SubclassWithProps.Props>(({Bool, Float}) => ({
      foo: [ Float, 0 ],
      bar: [ Bool, true ],
    }))
  }
}

namespace SubSubclassWithProps {
  export type Attrs = p.AttrsOf<Props>
  export type Props = SubclassWithProps.Props & {
    baz: p.Property<string>
  }
}
interface SubSubclassWithProps extends SubSubclassWithProps.Attrs {}
class SubSubclassWithProps extends SubclassWithProps {
  declare properties: SubSubclassWithProps.Props
  constructor(attrs?: Partial<SubSubclassWithProps.Attrs>) {
    super(attrs)
  }
  static {
    this.define<SubSubclassWithProps.Props>(({Str}) => ({
      baz: [ Str, "" ],
    }))
  }
}

// TODO {{{
class SubclassWithMixins extends HasProps {}
SubclassWithMixins.mixins([mixins.Line])

class SubSubclassWithMixins extends SubclassWithMixins {}
SubSubclassWithMixins.mixins([["foo_", mixins.Fill]])

class SubclassWithMultipleMixins extends HasProps {}
SubclassWithMultipleMixins.mixins([mixins.Line, ["bar_", mixins.Text]])
// }}}

let counter = 0
function next(): number {
  return counter++
}

namespace Some0 {
  export type Attrs = p.AttrsOf<Props>
  export type Props = HasProps.Props & {
    prop0: p.Property<number>
    prop1: p.Property<number>
    prop2: p.Property<number>
  }
}
interface Some0 extends Some0.Attrs {}
class Some0 extends HasProps {
  declare properties: Some0.Props
  constructor(attrs?: Partial<Some0.Attrs>) {
    super(attrs)
  }
  static {
    this.define<Some0.Props>(({Float}) => ({
      prop0: [ Float, () => next() ],
      prop1: [ Float, () => next() ],
      prop2: [ Float, () => next() ],
    }))
  }
}

describe("core/has_props module", () => {

  describe("creation", () => {

    it("empty model should have no properties", () => {
      const obj = new EmptyModel()
      expect(keys(obj.properties)).to.be.equal([])
      expect(keys(obj.attributes)).to.be.equal([])
    })

    it("should combine props from subclasses", () => {
      const obj = new SubclassWithProps()
      expect(keys(obj.properties)).to.be.equal(["foo", "bar"])
    })

    it("should combine props from sub-subclasses", () => {
      const obj = new SubSubclassWithProps()
      expect(keys(obj.properties)).to.be.equal(["foo", "bar", "baz"])
    })

    it("should combine mixins from subclasses", () => {
      const obj = new SubclassWithMixins()
      const props = keys(mixins.Line)
      expect(keys(obj.properties)).to.be.equal(props)
    })

    it("should combine mixins from sub-subclasses", () => {
      const obj = new SubSubclassWithMixins()
      const props = [...keys(mixins.Line), ...keys(mixins.Fill).map((key) => `foo_${key}`)]
      expect(keys(obj.properties)).to.be.equal(props)
    })

    it("should combine multiple mixins from subclasses", () => {
      const obj = new SubclassWithMultipleMixins()
      const props = [...keys(mixins.Line), ...keys(mixins.Text).map((key) => `bar_${key}`)]
      expect(keys(obj.properties)).to.be.equal(props)
    })

    it("should fail when unknown properties are used", () => {
      expect(() => new (SubclassWithProps as any)({whatever: true})).to.throw(Error, "unknown property SubclassWithProps.whatever")
    })

    it("should initialize properties in definition order", () => {
      counter = 0
      const obj0 = new Some0()
      expect(obj0.prop0).to.be.equal(0)
      expect(obj0.prop1).to.be.equal(1)
      expect(obj0.prop2).to.be.equal(2)

      counter = 0
      const obj1 = new Some0({prop0: 10})
      expect(obj1.prop0).to.be.equal(10)
      expect(obj1.prop1).to.be.equal(0)
      expect(obj1.prop2).to.be.equal(1)

      counter = 0
      const obj2 = new Some0({prop1: 20})
      expect(obj2.prop0).to.be.equal(0)
      expect(obj2.prop1).to.be.equal(20)
      expect(obj2.prop2).to.be.equal(1)

      const resolver0 = new ModelResolver(default_resolver, [Some0])
      const serializer0 = new Serializer()
      const deserializer0 = new Deserializer(resolver0)

      counter = 0
      const obj0_ = deserializer0.decode(serializer0.encode(obj0))
      expect_instanceof(obj0_, Some0)
      expect(obj0_.prop0).to.be.equal(0)
      expect(obj0_.prop1).to.be.equal(1)
      expect(obj0_.prop2).to.be.equal(2)

      const resolver1 = new ModelResolver(default_resolver, [Some0])
      const serializer1 = new Serializer()
      const deserializer1 = new Deserializer(resolver1)

      counter = 0
      const obj1_ = deserializer1.decode(serializer1.encode(obj1))
      expect_instanceof(obj1_, Some0)
      expect(obj1_.prop0).to.be.equal(10)
      expect(obj1_.prop1).to.be.equal(0)
      expect(obj1_.prop2).to.be.equal(1)

      const resolver2 = new ModelResolver(default_resolver, [Some0])
      const serializer2 = new Serializer()
      const deserializer2 = new Deserializer(resolver2)

      counter = 0
      const obj2_ = deserializer2.decode(serializer2.encode(obj2))
      expect_instanceof(obj2_, Some0)
      expect(obj2_.prop0).to.be.equal(0)
      expect(obj2_.prop1).to.be.equal(20)
      expect(obj2_.prop2).to.be.equal(1)
    })
  })

  it("implements HasProps[toStringTag] method", () => {
    const obj0 = new SubclassWithProps()
    const obj1 = new SubSubclassWithProps()

    expect(Object.prototype.toString.call(obj0)).to.be.equal("[object SubclassWithProps]")
    expect(Object.prototype.toString.call(obj1)).to.be.equal("[object SubSubclassWithProps]")
  })

  it("support HasProps.references() method (issue #12783)", () => {
    const obj0 = new TestModel()
    const obj1 = new TestModel()
    const obj2 = new TestModel()
    const obj3 = new TestModel()
    const obj4 = new TestModel()
    const obj5 = new TestModel()
    const obj6 = new TestModel()
    const obj7 = new TestModel()
    const obj8 = new TestModel()
    const obj9 = new TestModel()

    obj3.p2 = obj8
    obj5.p5 = new Map([[obj9, obj9]])

    const obj = new TestModel({
      p2: obj0,
      p3: [obj1, obj2],
      p4: new Set([obj3, obj4]),
      p5: new Map([[obj5, obj6]]),
      p6: {foo: obj7},
    })

    const refs = new Set([obj, obj0, obj1, obj2, obj3, obj4, obj5, obj6, obj7, obj8, obj9])
    expect(obj.references()).to.be.equal(refs)
  })
})
