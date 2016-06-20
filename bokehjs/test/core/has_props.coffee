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

    it "should have no properties", ->
      obj = new HasProps()
      expect(obj.properties).to.be.deep.equal {}

    it "should combine props from subclasses", ->
      obj = new SubclassWithProps()
      expect(_.keys(obj.properties)).to.be.deep.equal ['foo', 'bar']

    it "should combine props from sub-subclasses", ->
      obj = new SubSubclassWithProps()
      expect(_.keys(obj.properties)).to.be.deep.equal ['foo', 'bar', 'baz']

    it "should combine mixins from subclasses", ->
      obj = new SubclassWithMixins()
      expect(_.keys(obj.properties)).to.be.deep.equal _.keys(mixins.line(""))

    it "should combine mixins from sub-subclasses", ->
      obj = new SubSubclassWithMixins()
      expect(_.keys(obj.properties)).to.be.deep.equal _.keys(_.extend mixins.line(""), mixins.fill("foo_"))

    it "should combine multiple mixins from subclasses", ->
      obj = new SubclassWithMultipleMixins()
      expect(_.keys(obj.properties)).to.be.deep.equal _.keys(_.extend mixins.line(""), mixins.text("bar_"))

  # it "should support computed properties", ->
  #   model = new TestObject({'a': 1, 'b': 1})
  #   model.define_computed_property 'c', ->
  #   @get('a') + @get('b')
  #   model.add_dependencies('c', model, ['a', 'b'])

  #   expect(model.get "c").to.equal 2

  # describe "cached properties", ->
  #   model = null
  #   before ->
  #     model = new TestObject({a: 1, b: 1})
  #     model.define_computed_property 'c', ->
  #         @get('a') + @get('b')
  #       , true
  #     model.add_dependencies('c', model, ['a', 'b'])

  #   it "should be computed", ->
  #     expect(model.get "c").to.equal(2)

  #   it "should store computed values in cache", ->
  #     expect(model._computed["c"].cache).to.not.be.undefined

  #   it "should invalidate cached values on changes", ->
  #     model.set('a', 10)

  #     expect(model.get "c").to.equal(11)

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
  #     output = model3.get('vectordata')

  #     expect(output[0].document).to.equal doc
  #     expect(output[1].document).to.equal doc
  #     expect(output[0]).to.equal model1
  #     expect(output[1]).to.equal model2

  #   it "should work with nested arrays", ->
  #     expect(model4.document).to.equal doc
  #     output = model4.get('vectordata')

  #     expect(output[0][0].document).to.equal doc
  #     expect(output[0][1].document).to.equal doc
  #     expect(output[0][0]).to.equal model1
  #     expect(output[0][1]).to.equal model2
