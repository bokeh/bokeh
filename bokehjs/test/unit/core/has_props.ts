import {expect, expect_instanceof, expect_not_null} from "#framework/assertions"

import {HasProps} from "@bokehjs/core/has_props"
import type {HasPropsFactory} from "@bokehjs/core/has_props"
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

namespace LifecycleModel {
  export type Attrs = p.AttrsOf<Props>
  export type Props = HasProps.Props & {
    value: p.Property<number>
  }
}
interface LifecycleModel extends LifecycleModel.Attrs {}
class LifecycleModel extends HasProps {
  declare properties: LifecycleModel.Props

  readonly calls: string[] = []
  readonly seed = 42

  constructor(attrs?: Partial<LifecycleModel.Attrs>) {
    super(attrs)
    this.calls.push("constructor")
  }

  static {
    this.define<LifecycleModel.Props, LifecycleModel>(({Float}) => ({
      value: [Float, (self) => {
        self.calls.push("properties")
        return self.seed
      }],
    }))
  }

  override initialize(): void {
    super.initialize()
    this.calls.push("initialize")
  }

  override connect_signals(): void {
    super.connect_signals()
    this.calls.push("connect_signals")
  }
}

class ExtensionModel extends LifecycleModel {}

let failed_model: HasProps | null = null
const get_failed_model = (): HasProps | null => failed_model

namespace PropertyFailureModel {
  export type Attrs = p.AttrsOf<Props>
  export type Props = HasProps.Props & {
    value: p.Property<number>
  }
}
interface PropertyFailureModel extends PropertyFailureModel.Attrs {}
class PropertyFailureModel extends HasProps {
  declare properties: PropertyFailureModel.Props

  static {
    this.define<PropertyFailureModel.Props, PropertyFailureModel>(({Float}) => ({
      value: [Float, (self) => {
        failed_model = self
        throw new Error("property initialization failed")
      }],
    }))
  }
}

class InitializeFailureModel extends HasProps {
  override initialize(): void {
    super.initialize()
    failed_model = this
    throw new Error("model initialization failed")
  }
}

class SignalFailureModel extends HasProps {
  override connect_signals(): void {
    super.connect_signals()
    failed_model = this
    throw new Error("signal initialization failed")
  }
}

class CleanupFailureModel extends InitializeFailureModel {
  override destroy(): void {
    super.destroy()
    throw new Error("cleanup failed")
  }
}

describe("core/has_props module", () => {

  describe("creation", () => {

    it("empty model should have no properties", () => {
      const obj = EmptyModel.create()
      expect(keys(obj.properties)).to.be.equal([])
      expect(keys(obj.attributes)).to.be.equal([])
    })

    it("should combine props from subclasses", () => {
      const obj = SubclassWithProps.create()
      expect(keys(obj.properties)).to.be.equal(["foo", "bar"])
    })

    it("should combine props from sub-subclasses", () => {
      const obj = SubSubclassWithProps.create()
      expect(keys(obj.properties)).to.be.equal(["foo", "bar", "baz"])
    })

    it("should combine mixins from subclasses", () => {
      const obj = SubclassWithMixins.create()
      const props = keys(mixins.Line)
      expect(keys(obj.properties)).to.be.equal(props)
    })

    it("should combine mixins from sub-subclasses", () => {
      const obj = SubSubclassWithMixins.create()
      const props = [...keys(mixins.Line), ...keys(mixins.Fill).map((key) => `foo_${key}`)]
      expect(keys(obj.properties)).to.be.equal(props)
    })

    it("should combine multiple mixins from subclasses", () => {
      const obj = SubclassWithMultipleMixins.create()
      const props = [...keys(mixins.Line), ...keys(mixins.Text).map((key) => `bar_${key}`)]
      expect(keys(obj.properties)).to.be.equal(props)
    })

    it("should fail when unknown properties are used", () => {
      expect(() => SubclassWithProps.create({whatever: true} as any)).to.throw(Error, "unknown property SubclassWithProps.whatever")
    })

    it("should require the factory entry point", () => {
      expect(() => new (EmptyModel as any)()).to.throw(Error, "use EmptyModel.create({...}) instead of new EmptyModel(...)")
    })

    it("should finish construction before initializing properties and signals", () => {
      const obj = LifecycleModel.create()

      expect(obj.value).to.be.equal(42)
      expect(obj.calls).to.be.equal(["constructor", "properties", "initialize", "connect_signals"])
      expect(obj.is_ready).to.be.true
    })

    it("should inherit create() without subclass boilerplate", () => {
      const obj = ExtensionModel.create({value: 10})

      expect(obj).to.be.instanceof(ExtensionModel)
      expect(obj.value).to.be.equal(10)
      expect(obj.calls).to.be.equal(["constructor", "initialize", "connect_signals"])
      expect(obj.is_ready).to.be.true
    })

    const failure_cases: [HasPropsFactory, string][] = [
      [PropertyFailureModel, "property initialization failed"],
      [InitializeFailureModel, "model initialization failed"],
      [SignalFailureModel, "signal initialization failed"],
    ]
    for (const [cls, message] of failure_cases) {
      it(`should destroy a model when ${message}`, () => {
        failed_model = null
        expect(() => cls.create()).to.throw(Error, message)
        const model = get_failed_model()
        expect_not_null(model)
        expect(model.is_destroyed).to.be.true
      })
    }

    it("should preserve a construction error when cleanup also fails", () => {
      failed_model = null
      expect(() => CleanupFailureModel.create()).to.throw(Error, "model initialization failed")
      const model = get_failed_model()
      expect_not_null(model)
      expect(model.is_destroyed).to.be.true
    })

    it("should allow destroy() to be called more than once", () => {
      const obj = EmptyModel.create()
      let destroyed = 0
      obj.destroyed.connect(() => destroyed += 1)

      obj.destroy()
      obj.destroy()

      expect(obj.is_destroyed).to.be.true
      expect(destroyed).to.be.equal(1)
    })

    it("should use the same lifecycle during deserialization", () => {
      const resolver = new ModelResolver(default_resolver, [LifecycleModel])
      const serializer = new Serializer()
      const deserializer = new Deserializer(resolver)
      const decoded = deserializer.decode(serializer.encode(LifecycleModel.create()))

      expect_instanceof(decoded, LifecycleModel)
      expect(decoded.value).to.be.equal(42)
      expect(decoded.calls).to.be.equal(["constructor", "properties", "initialize", "connect_signals"])
      expect(decoded.is_ready).to.be.true
    })

    it("should initialize properties in definition order", () => {
      counter = 0
      const obj0 = Some0.create()
      expect(obj0.prop0).to.be.equal(0)
      expect(obj0.prop1).to.be.equal(1)
      expect(obj0.prop2).to.be.equal(2)

      counter = 0
      const obj1 = Some0.create({prop0: 10})
      expect(obj1.prop0).to.be.equal(10)
      expect(obj1.prop1).to.be.equal(0)
      expect(obj1.prop2).to.be.equal(1)

      counter = 0
      const obj2 = Some0.create({prop1: 20})
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
    const obj0 = SubclassWithProps.create()
    const obj1 = SubSubclassWithProps.create()

    expect(Object.prototype.toString.call(obj0)).to.be.equal("[object SubclassWithProps]")
    expect(Object.prototype.toString.call(obj1)).to.be.equal("[object SubSubclassWithProps]")
  })

  it("support HasProps.references() method (issue #12783)", () => {
    const obj0 = TestModel.create()
    const obj1 = TestModel.create()
    const obj2 = TestModel.create()
    const obj3 = TestModel.create()
    const obj4 = TestModel.create()
    const obj5 = TestModel.create()
    const obj6 = TestModel.create()
    const obj7 = TestModel.create()
    const obj8 = TestModel.create()
    const obj9 = TestModel.create()

    obj3.p2 = obj8
    obj5.p5 = new Map([[obj9, obj9]])

    const obj = TestModel.create({
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
