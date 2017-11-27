{expect} = require "chai"
utils = require "../utils"
fixtures = require "./fixtures/object"

{ColumnDataSource} = utils.require("models/sources/column_data_source")
{Models} = utils.require "base"
{HasProps} = utils.require "core/has_props"
p = utils.require "core/properties"
mixins = utils.require "core/property_mixins"
{Document} = utils.require "document"

class SubclassWithProps extends HasProps
  @define {
    foo: [ p.Number, 0    ]
    bar: [ p.Bool,   true ]
  }

class SubSubclassWithProps extends SubclassWithProps
  @define {
    baz: [ p.String, '' ]
  }

class SubclassWithMixins extends HasProps
  @mixin('line')

class SubSubclassWithMixins extends SubclassWithMixins
  @mixin('fill:foo_')

class SubclassWithMultipleMixins extends HasProps
  @mixin('line', 'text:bar_')

class SubclassWithNumberSpec extends HasProps
  @define {
    foo: [ p.NumberSpec, {field: 'colname'} ]
    bar: [ p.Bool,       true               ]
  }

class SubclassWithDistanceSpec extends HasProps
  @define {
    foo: [ p.DistanceSpec, {field: 'colname'} ]
    bar: [ p.Bool,         true               ]
  }

class SubclassWithTransformSpec extends HasProps
  @define {
    foo: [ p.NumberSpec, {field: 'colname', transform: new fixtures.Model()} ]
    bar: [ p.Bool,       true               ]
  }

class SubclassWithOptionalSpec extends HasProps
  @define {
    foo: [ p.NumberSpec, {value: null}      ]
    bar: [ p.Bool,       true               ]
    baz: [ p.NumberSpec, {field: 'colname'} ]
  }

describe "has_properties module", ->

  before ->
    Models.register('TestObject', fixtures.Model)
  after ->
    Models.unregister('TestObject')

  describe "creation", ->

    it "should have only id property", ->
      obj = new HasProps()
      expect(Object.keys(obj.properties)).to.be.deep.equal ['id']
      expect(Object.keys(obj.attributes)).to.be.deep.equal ['id']

    it "should combine props from subclasses", ->
      obj = new SubclassWithProps()
      expect(Object.keys(obj.properties)).to.be.deep.equal ['id', 'foo', 'bar']

    it "should combine props from sub-subclasses", ->
      obj = new SubSubclassWithProps()
      expect(Object.keys(obj.properties)).to.be.deep.equal ['id', 'foo', 'bar', 'baz']

    it "should combine mixins from subclasses", ->
      obj = new SubclassWithMixins()
      props = Object.keys(mixins.line(""))
      expect(Object.keys(obj.properties)).to.be.deep.equal(['id'].concat(props))

    it "should combine mixins from sub-subclasses", ->
      obj = new SubSubclassWithMixins()
      props = Object.keys(Object.assign(mixins.line(""), mixins.fill("foo_")))
      expect(Object.keys(obj.properties)).to.be.deep.equal(['id'].concat(props))

    it "should combine multiple mixins from subclasses", ->
      obj = new SubclassWithMultipleMixins()
      props = Object.keys(Object.assign(mixins.line(""), mixins.text("bar_")))
      expect(Object.keys(obj.properties)).to.be.deep.equal(['id'].concat(props))

  describe "materialize_dataspecs", ->
    it "should collect dataspecs", ->
      r = new ColumnDataSource({data: {colname: [1, 2, 3, 4]}})
      obj = new SubclassWithNumberSpec()
      data = obj.materialize_dataspecs(r)
      expect(data).to.be.deep.equal {_foo: [1, 2, 3, 4]}

    it "should collect shapes when they are present", ->
      r = new ColumnDataSource({data: {colname: [1, 2, 3, 4]}})
      r._shapes.colname = [2, 2]
      obj = new SubclassWithNumberSpec()
      data = obj.materialize_dataspecs(r)
      expect(data).to.be.deep.equal {_foo: [1, 2, 3, 4], _foo_shape: [2, 2]}

    it "should collect max vals for distance specs", ->
      r = new ColumnDataSource({data: {colname: [1, 2, 3, 4, 2]}})
      obj = new SubclassWithDistanceSpec()

      data = obj.materialize_dataspecs(r)
      expect(data).to.be.deep.equal {_foo: [1, 2, 3, 4, 2], max_foo: 4}

      r._shapes.colname = [2, 2]
      data = obj.materialize_dataspecs(r)
      expect(data).to.be.deep.equal {_foo: [1, 2, 3, 4, 2], _foo_shape: [2, 2], max_foo: 4}

    it "should collect ignore optional specs with null values", ->
      r = new ColumnDataSource({data: {colname: [1, 2, 3, 4]}})
      obj = new SubclassWithOptionalSpec()
      obj.properties.foo.optional = true
      data = obj.materialize_dataspecs(r)
      expect(data).to.be.deep.equal {_baz: [1, 2, 3, 4]}

  # describe "arrays of references", ->
  #   [model1, model2, model3, model4, doc] = [null, null, null, null, null]
  #   before ->
  #     model1 = new TestObject({a: 1, b: 1})
  #     model2 = new TestObject({a: 2, b: 2})
  #     model3 = new TestObject(
  #       a: 1
  #       b: 1
  #       vectordata: [model1.ref(), model2.ref()]
  #     )
  #     model4 = new TestObject(
  #       a: 1
  #       b: 1
  #       vectordata: [[model1.ref(), model2.ref()]]
  #     )

  #     # resolving refs should only work if we're in a document
  #     # (really, we should probably simply not put refs in an array
  #     # outside of while deserializing a document...
  #     # not sure the real code ever does this anymore, we may
  #     # be able to delete resolve_ref and delete these tests)
  #     doc = new Document()
  #     doc.add_root(model1)
  #     doc.add_root(model2)
  #     doc.add_root(model3)
  #     doc.add_root(model4)

  #   it "should dereference elements by default if inside a document", ->
  #     expect(model3.document).to.equal doc
  #     output = model3.vectordata

  #     expect(output[0].document).to.equal doc
  #     expect(output[1].document).to.equal doc
  #     expect(output[0]).to.equal model1
  #     expect(output[1]).to.equal model2

  #   it "should work with nested arrays", ->
  #     expect(model4.document).to.equal doc
  #     output = model4.vectordata

  #     expect(output[0][0].document).to.equal doc
  #     expect(output[0][1].document).to.equal doc
  #     expect(output[0][0]).to.equal model1
  #     expect(output[0][1]).to.equal model2
