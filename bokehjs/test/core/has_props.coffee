{expect} = require "chai"
_ = require "underscore"
utils = require "../utils"
fixtures = require "./fixtures/object"

{Models} = utils.require "base"
HasProps = utils.require "core/has_props"
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

describe "has_properties module", ->

  before ->
    Models.register('TestObject', fixtures.Model)
  after ->
    Models.unregister('TestObject')

  describe "creation", ->

    it "should have only id property", ->
      obj = new HasProps()
      expect(_.keys(obj.properties)).to.be.deep.equal ['id']
      expect(_.keys(obj.attributes)).to.be.deep.equal ['id']

    it "should combine props from subclasses", ->
      obj = new SubclassWithProps()
      expect(_.keys(obj.properties)).to.be.deep.equal ['id', 'foo', 'bar']

    it "should combine props from sub-subclasses", ->
      obj = new SubSubclassWithProps()
      expect(_.keys(obj.properties)).to.be.deep.equal ['id', 'foo', 'bar', 'baz']

    it "should combine mixins from subclasses", ->
      obj = new SubclassWithMixins()
      props = _.keys(mixins.line(""))
      expect(_.keys(obj.properties)).to.be.deep.equal(['id'].concat(props))

    it "should combine mixins from sub-subclasses", ->
      obj = new SubSubclassWithMixins()
      props = _.keys(_.extend(mixins.line(""), mixins.fill("foo_")))
      expect(_.keys(obj.properties)).to.be.deep.equal(['id'].concat(props))

    it "should combine multiple mixins from subclasses", ->
      obj = new SubclassWithMultipleMixins()
      props = _.keys(_.extend(mixins.line(""), mixins.text("bar_")))
      expect(_.keys(obj.properties)).to.be.deep.equal(['id'].concat(props))

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
