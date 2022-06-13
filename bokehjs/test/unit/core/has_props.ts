import {expect} from "assertions"

import {assert} from "@bokehjs/core/util/assert"
import {HasProps} from "@bokehjs/core/has_props"
import * as mixins from "@bokehjs/core/property_mixins"
import {Serializer} from "@bokehjs/core/serialization/serializer"
import {Deserializer} from "@bokehjs/core/serialization/deserializer"
import {ModelResolver} from "@bokehjs/core/resolvers"
import {default_resolver} from "@bokehjs/base"
import * as p from "@bokehjs/core/properties"
import {keys} from "@bokehjs/core/util/object"

class TestModel extends HasProps {}

namespace SubclassWithProps {
  export type Attrs = p.AttrsOf<Props>
  export type Props = HasProps.Props & {
    foo: p.Property<number>
    bar: p.Property<boolean>
  }
}
interface SubclassWithProps extends SubclassWithProps.Attrs {}
class SubclassWithProps extends HasProps {
  override properties: SubclassWithProps.Props
  constructor(attrs?: Partial<SubclassWithProps.Attrs>) {
    super(attrs)
  }
  static {
    this.define<SubclassWithProps.Props>(({Boolean, Number}) => ({
      foo: [ Number, 0 ],
      bar: [ Boolean, true ],
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
  override properties: SubSubclassWithProps.Props
  constructor(attrs?: Partial<SubSubclassWithProps.Attrs>) {
    super(attrs)
  }
  static {
    this.define<SubSubclassWithProps.Props>(({String}) => ({
      baz: [ String, "" ],
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
  override properties: Some0.Props
  constructor(attrs?: Partial<Some0.Attrs>) {
    super(attrs)
  }
  static {
    this.define<Some0.Props>(({Number}) => ({
      prop0: [ Number, () => next() ],
      prop1: [ Number, () => next() ],
      prop2: [ Number, () => next() ],
    }))
  }
}

describe("core/has_props module", () => {

  describe("creation", () => {

    it("empty model should have no properties", () => {
      const obj = new TestModel()
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
      assert(obj0_ instanceof Some0)
      expect(obj0_.prop0).to.be.equal(0)
      expect(obj0_.prop1).to.be.equal(1)
      expect(obj0_.prop2).to.be.equal(2)

      const resolver1 = new ModelResolver(default_resolver, [Some0])
      const serializer1 = new Serializer()
      const deserializer1 = new Deserializer(resolver1)

      counter = 0
      const obj1_ = deserializer1.decode(serializer1.encode(obj1))
      assert(obj1_ instanceof Some0)
      expect(obj1_.prop0).to.be.equal(10)
      expect(obj1_.prop1).to.be.equal(0)
      expect(obj1_.prop2).to.be.equal(1)

      const resolver2 = new ModelResolver(default_resolver, [Some0])
      const serializer2 = new Serializer()
      const deserializer2 = new Deserializer(resolver2)

      counter = 0
      const obj2_ = deserializer2.decode(serializer2.encode(obj2))
      assert(obj2_ instanceof Some0)
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
})
