import {expect} from "chai"

import {ColumnDataSource} from "models/sources/column_data_source"
//import {Models} from "base"
import {HasProps} from "core/has_props"
import * as mixins from "core/property_mixins"
import * as p from "core/properties"
import {keys, extend} from "core/util/object"

class TestModel extends HasProps {}
TestModel.prototype.type = "TestModel"

class SubclassWithProps extends HasProps {
  foo: number
  bar: boolean
}
SubclassWithProps.prototype.type = "SubclassWithProps"
SubclassWithProps.define({
  foo: [ p.Number, 0    ],
  bar: [ p.Bool,   true ],
})

class SubSubclassWithProps extends SubclassWithProps {
  baz: string
}
SubSubclassWithProps.prototype.type = "SubSubclassWithProps"
SubSubclassWithProps.define({
  baz: [ p.String, '' ],
})

class SubclassWithMixins extends HasProps {}
SubclassWithMixins.prototype.type = "SubclassWithMixins"
SubclassWithMixins.mixin('line')

class SubSubclassWithMixins extends SubclassWithMixins {}
SubSubclassWithMixins.prototype.type = "SubSubclassWithMixins"
SubSubclassWithMixins.mixin('fill:foo_')

class SubclassWithMultipleMixins extends HasProps {}
SubclassWithMultipleMixins.prototype.type = "SubclassWithMultipleMixins"
SubclassWithMultipleMixins.mixin('line', 'text:bar_')

class SubclassWithNumberSpec extends HasProps {
  foo: any // XXX
  bar: boolean
}
SubclassWithNumberSpec.prototype.type = "SubclassWithNumberSpec"
SubclassWithNumberSpec.define({
  foo: [ p.NumberSpec, {field: 'colname'} ],
  bar: [ p.Bool,       true               ],
})

class SubclassWithDistanceSpec extends HasProps {
  foo: any // XXX
  bar: boolean
}
SubclassWithDistanceSpec.prototype.type = "SubclassWithDistanceSpec"
SubclassWithDistanceSpec.define({
  foo: [ p.DistanceSpec, {field: 'colname'} ],
  bar: [ p.Bool,         true               ],
})

class SubclassWithTransformSpec extends HasProps {
  foo: any // XX
  bar: boolean
}
SubclassWithTransformSpec.prototype.type = "SubclassWithTransformSpec"
SubclassWithTransformSpec.define({
  foo: [ p.NumberSpec, {field: 'colname', transform: new TestModel()} ],
  bar: [ p.Bool,       true               ],
})

class SubclassWithOptionalSpec extends HasProps {
  foo: any // XXX
  bar: boolean
  baz: any // XXX
}
SubclassWithOptionalSpec.prototype.type = "SubclassWithOptionalSpec"
SubclassWithOptionalSpec.define({
  foo: [ p.NumberSpec, {value: null}      ],
  bar: [ p.Bool,       true               ],
  baz: [ p.NumberSpec, {field: 'colname'} ],
})

describe("has_properties module", () => {

  /*
  before ->
    Models.register('TestObject', TestModel)
  after ->
    Models.unregister('TestObject')
  */

  describe("creation", () => {

    it("should have only id property", () => {
      const obj = new TestModel()
      expect(keys(obj.properties)).to.be.deep.equal(['id'])
      expect(keys(obj.attributes)).to.be.deep.equal(['id'])
    })

    it("should combine props from subclasses", () => {
      const obj = new SubclassWithProps()
      expect(keys(obj.properties)).to.be.deep.equal(['id', 'foo', 'bar'])
    })

    it("should combine props from sub-subclasses", () => {
      const obj = new SubSubclassWithProps()
      expect(keys(obj.properties)).to.be.deep.equal(['id', 'foo', 'bar', 'baz'])
    })

    it("should combine mixins from subclasses", () => {
      const obj = new SubclassWithMixins()
      const props = keys(mixins.line(""))
      expect(keys(obj.properties)).to.be.deep.equal(['id'].concat(props))
    })

    it("should combine mixins from sub-subclasses", () => {
      const obj = new SubSubclassWithMixins()
      const props = keys(extend(mixins.line(""), mixins.fill("foo_")))
      expect(keys(obj.properties)).to.be.deep.equal(['id'].concat(props))
    })

    it("should combine multiple mixins from subclasses", () => {
      const obj = new SubclassWithMultipleMixins()
      const props = keys(extend(mixins.line(""), mixins.text("bar_")))
      expect(keys(obj.properties)).to.be.deep.equal(['id'].concat(props))
    })
  })

  describe("materialize_dataspecs", () => {
    it("should collect dataspecs", () => {
      const r = new ColumnDataSource({data: {colname: [1, 2, 3, 4]}})
      const obj = new SubclassWithNumberSpec()
      const data = obj.materialize_dataspecs(r)
      expect(data).to.be.deep.equal({_foo: [1, 2, 3, 4]})
    })

    it("should collect shapes when they are present", () => {
      const r = new ColumnDataSource({data: {colname: [1, 2, 3, 4]}})
      r._shapes["colname"] = [2, 2]
      const obj = new SubclassWithNumberSpec()
      const data = obj.materialize_dataspecs(r)
      expect(data).to.be.deep.equal({_foo: [1, 2, 3, 4], _foo_shape: [2, 2]})
    })

    it("should collect max vals for distance specs", () => {
      const r = new ColumnDataSource({data: {colname: [1, 2, 3, 4, 2]}})
      const obj = new SubclassWithDistanceSpec()

      const data0 = obj.materialize_dataspecs(r)
      expect(data0).to.be.deep.equal({_foo: [1, 2, 3, 4, 2], max_foo: 4})

      r._shapes["colname"] = [2, 2]
      const data1 = obj.materialize_dataspecs(r)
      expect(data1).to.be.deep.equal({_foo: [1, 2, 3, 4, 2], _foo_shape: [2, 2], max_foo: 4})
    })

    it("should collect ignore optional specs with null values", () => {
      const r = new ColumnDataSource({data: {colname: [1, 2, 3, 4]}})
      const obj = new SubclassWithOptionalSpec()
      obj.properties.foo.optional = true
      const data = obj.materialize_dataspecs(r)
      expect(data).to.be.deep.equal({_baz: [1, 2, 3, 4]})
    })
  })
})
