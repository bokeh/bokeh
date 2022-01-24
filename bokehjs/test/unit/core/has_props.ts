import {expect} from "assertions"

import {HasProps} from "@bokehjs/core/has_props"
import * as mixins from "@bokehjs/core/property_mixins"
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
  })

  it("implements HasProps[toStringTag] method", () => {
    const obj0 = new SubclassWithProps()
    const obj1 = new SubSubclassWithProps()

    expect(Object.prototype.toString.call(obj0)).to.be.equal("[object SubclassWithProps]")
    expect(Object.prototype.toString.call(obj1)).to.be.equal("[object SubSubclassWithProps]")
  })
})
