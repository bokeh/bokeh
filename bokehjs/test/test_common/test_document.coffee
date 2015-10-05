_ = require "underscore"
{expect} = require "chai"
utils = require "../utils"

HasProperties = utils.require "common/has_properties"
{Document, ModelChangedEvent} = utils.require "common/document"
base = utils.require "common/base"
Collection = utils.require "common/collection"

make_collection = (model) ->
  class C extends Collection
    model: model
  return new C()

register_test_collection = (name, model) ->
  C = make_collection(model)
  base.collection_overrides[name] = C

class AnotherModel extends HasProperties
  type: 'AnotherModel'
  defaults: () ->
    return _.extend {}, super(), {
      bar: 1
    }

register_test_collection('AnotherModel', AnotherModel)

class SomeModel extends HasProperties
  type: 'SomeModel'
  defaults: () ->
    return _.extend {}, super(), {
      foo: 2
      child: null
    }

register_test_collection('SomeModel', SomeModel)

describe "Document", ->

  it "should be constructable", ->
    d = new Document()
    expect(d.roots().length).to.equal 0

  it "has working add_root", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    d.add_root(new AnotherModel())
    expect(d.roots().length).to.equal 1

  it "tracks all_models", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(Object.keys(d._all_models).length).to.equal 0
    m = new SomeModel()
    m2 = new AnotherModel()
    m.set({ child: m2 })
    expect(m.get('child')).to.equal m2
    d.add_root(m)
    expect(d.roots().length).to.equal 1
    expect(Object.keys(d._all_models).length).to.equal 2

    m.set({ child: null })
    expect(Object.keys(d._all_models).length).to.equal 1
    m.set({ child: m2 })
    expect(Object.keys(d._all_models).length).to.equal 2
    d.remove_root(m)
    expect(d.roots().length).to.equal 0
    expect(Object.keys(d._all_models).length).to.equal 0

  # TODO copy the following tests from test_document.py here
  # TODO(havocp) test_all_models_with_multiple_references
  # TODO(havocp) test_all_models_with_cycles
  # TODO(havocp) test_change_notification
  # TODO(havocp) test_change_notification_removal
  # TODO(havocp) test_notification_of_roots
  # TODO(havocp) test_clear


  it "can serialize with one model in it", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    root1 = new SomeModel()
    d.add_root(root1)
    expect(d.roots().length).to.equal 1

    json = d.to_json_string()
    copy = Document.from_json_string(json)

    expect(copy.roots().length).to.equal 1
    expect(copy.roots()[0]).to.be.an.instanceof(SomeModel)

  # TODO copy the following tests from test_document.py here
  # TODO(havocp) test_serialization_more_models

  it "can patch an integer property", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(Object.keys(d._all_models).length).to.equal 0

    root1 = new SomeModel({ foo: 42 })
    root2 = new SomeModel({ foo: 43 })
    child1 = new SomeModel({ foo: 44 })
    root1.set { child: child1 }
    root2.set { child: child1 }
    d.add_root(root1)
    d.add_root(root2)
    expect(d.roots().length).to.equal 2

    event1 = new ModelChangedEvent(d, root1, 'foo', root1.get('foo'), 57)
    patch1 = d.create_json_patch_string([event1])
    d.apply_json_patch_string(patch1)

    expect(root1.get('foo')).to.equal 57

    event2 = new ModelChangedEvent(d, child1, 'foo', child1.get('foo'), 67)
    patch2 = d.create_json_patch_string([event2])
    d.apply_json_patch_string(patch2)

    expect(child1.get('foo')).to.equal 67

  # TODO copy the following tests from test_document.py here
  # TODO(havocp) test_patch_reference_property
  # TODO(havocp) test_patch_two_properties_at_once

