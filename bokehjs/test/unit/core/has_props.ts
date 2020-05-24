import {expect} from "chai"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {HasProps} from "@bokehjs/core/has_props"
import * as mixins from "@bokehjs/core/property_mixins"
import * as p from "@bokehjs/core/properties"
import {keys} from "@bokehjs/core/util/object"
import {ndarray} from "@bokehjs/core/util/ndarray"

class TestModel extends HasProps {}

class SubclassWithProps extends HasProps {
  foo: number
  bar: boolean
}
SubclassWithProps.define<any>({
  foo: [ p.Number,  0    ],
  bar: [ p.Boolean, true ],
})

class SubSubclassWithProps extends SubclassWithProps {
  baz: string
}
SubSubclassWithProps.define<any>({
  baz: [ p.String, '' ],
})

class SubclassWithMixins extends HasProps {}
SubclassWithMixins.mixins(['line'])

class SubSubclassWithMixins extends SubclassWithMixins {}
SubSubclassWithMixins.mixins(['fill:foo_'])

class SubclassWithMultipleMixins extends HasProps {}
SubclassWithMultipleMixins.mixins(['line', 'text:bar_'])

class SubclassWithNumberSpec extends HasProps {
  foo: any // XXX
  bar: boolean
}
SubclassWithNumberSpec.define<any>({
  foo: [ p.NumberSpec, {field: 'colname'} ],
  bar: [ p.Boolean,    true               ],
})

class SubclassWithDistanceSpec extends HasProps {
  foo: any // XXX
  bar: boolean
}
SubclassWithDistanceSpec.define<any>({
  foo: [ p.DistanceSpec, {field: 'colname'} ],
  bar: [ p.Boolean,      true               ],
})

class SubclassWithTransformSpec extends HasProps {
  foo: any // XX
  bar: boolean
}
SubclassWithTransformSpec.define<any>({
  foo: [ p.NumberSpec, {field: 'colname', transform: new TestModel()} ],
  bar: [ p.Boolean,    true               ],
})

class SubclassWithOptionalSpec extends HasProps {
  foo: any // XXX
  bar: boolean
  baz: any // XXX
}
SubclassWithOptionalSpec.define<any>({
  foo: [ p.NumberSpec, {value: null}, {optional: true} ],
  bar: [ p.Boolean,    true               ],
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
      const props = keys(mixins.Line)
      expect(keys(obj.properties)).to.be.deep.equal(['id'].concat(props))
    })

    it("should combine mixins from sub-subclasses", () => {
      const obj = new SubSubclassWithMixins()
      const props = [...keys(mixins.Line), ...keys(mixins.Fill).map((key) => `foo_${key}`)]
      expect(keys(obj.properties)).to.be.deep.equal(['id'].concat(props))
    })

    it("should combine multiple mixins from subclasses", () => {
      const obj = new SubclassWithMultipleMixins()
      const props = [...keys(mixins.Line), ...keys(mixins.Text).map((key) => `bar_${key}`)]
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
      const array = ndarray([1, 2, 3, 4], {shape: [2, 2]})
      const r = new ColumnDataSource({data: {colname: array}})
      const obj = new SubclassWithNumberSpec()
      const data = obj.materialize_dataspecs(r)
      expect(data).to.be.deep.equal({_foo: ndarray([1, 2, 3, 4], {shape: [2, 2]})})
    })

    it("should collect max vals for distance specs", () => {
      const r0 = new ColumnDataSource({data: {colname: [1, 2, 3, 4, 2]}})
      const obj = new SubclassWithDistanceSpec()

      const data0 = obj.materialize_dataspecs(r0)
      expect(data0).to.be.deep.equal({_foo: [1, 2, 3, 4, 2], max_foo: 4})

      const array1 = ndarray([1, 2, 3, 4, 2], {shape: [2, 2]})
      const r1 = new ColumnDataSource({data: {colname: array1}})
      const data1 = obj.materialize_dataspecs(r1)
      expect(data1).to.be.deep.equal({_foo: ndarray([1, 2, 3, 4, 2], {shape: [2, 2]}), max_foo: 4})
    })

    it("should collect ignore optional specs with null values", () => {
      const r = new ColumnDataSource({data: {colname: [1, 2, 3, 4]}})
      const obj = new SubclassWithOptionalSpec()
      const data = obj.materialize_dataspecs(r)
      expect(data).to.be.deep.equal({_baz: [1, 2, 3, 4]})
    })
  })

  describe("HasProps.struct()", () => {

    it("should return a correct struct for a standard HasProps", () => {
      const obj = new TestModel()
      const struct = obj.struct()
      expect(struct.id).to.be.equal(obj.id)
      expect(struct.type).to.be.equal(obj.type)
      expect(struct.subtype).to.be.undefined
    })

    it("should return a correct struct for a subtype HasProps", () => {
      const obj = new TestModel()
      obj._subtype = "bar"
      const struct = obj.struct()
      expect(struct.id).to.be.equal(obj.id)
      expect(struct.type).to.be.equal(obj.type)
      expect(struct.subtype).to.be.equal("bar")
    })
  })
})
