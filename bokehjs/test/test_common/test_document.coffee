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

class ModelWithConstructTimeChanges extends HasProperties
  type: 'ModelWithConstructTimeChanges'

  initialize: (attributes, options) ->
    super(attributes, options)
    @set('foo', 4)
    @set('child', new AnotherModel())

  defaults: () ->
    return _.extend {}, super(), {
      foo: 2
      child: null
    }

register_test_collection('ModelWithConstructTimeChanges', ModelWithConstructTimeChanges)

class ComplicatedModelWithConstructTimeChanges extends HasProperties
  type: 'ComplicatedModelWithConstructTimeChanges'

  initialize: (attributes, options) ->
    super(attributes, options)
    @set('list_prop', [new AnotherModel()])
    @set('dict_prop', { foo: new AnotherModel() })
    @set('obj_prop', new ModelWithConstructTimeChanges())
    @set('dict_of_list_prop', { foo: [new AnotherModel()] })

  defaults: () ->
    return _.extend {}, super(), {
      # test the case where we have none of the attributes to begin with
    }

register_test_collection('ComplicatedModelWithConstructTimeChanges', ComplicatedModelWithConstructTimeChanges)

describe "Document", ->

  it "should be constructable", ->
    d = new Document()
    expect(d.roots().length).to.equal 0

  it "has working add_root", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    d.add_root(new AnotherModel())
    expect(d.roots().length).to.equal 1

  it "has working set_title", ->
    d = new Document()
    expect(d.title()).to.equal "Bokeh Application"
    d.set_title("Foo")
    expect(d.title()).to.equal "Foo"

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

  it "lets us get_model_by_id", ->
    d = new Document()
    m = new SomeModel()
    m2 = new AnotherModel()
    m.set({ child: m2 })
    d.add_root(m)
    expect(d.get_model_by_id(m.id)).to.equal(m)
    expect(d.get_model_by_id(m2.id)).to.equal(m2)
    expect(d.get_model_by_id("invalidid")).to.equal(null)

  it "lets us get_model_by_name", ->
    d = new Document()
    m = new SomeModel({ name : "foo" })
    m2 = new AnotherModel({ name : "bar" })
    m.set({ child: m2 })
    d.add_root(m)
    expect(d.get_model_by_name(m.get('name'))).to.equal(m)
    expect(d.get_model_by_name(m2.get('name'))).to.equal(m2)
    expect(d.get_model_by_name("invalidid")).to.equal(null)

  it "lets us get_model_by_name after changing name", ->
    d = new Document()
    m = new SomeModel({ name : "foo" })
    d.add_root(m)
    expect(d.get_model_by_name("foo")).to.equal(m)
    expect(d.get_model_by_name("bar")).to.equal(null)
    m.set({ name : "bar" })
    expect(d.get_model_by_name("foo")).to.equal(null)
    expect(d.get_model_by_name("bar")).to.equal(m)

  it "throws on get_model_by_name with duplicate name", ->
    d = new Document()
    m = new SomeModel({ name : "foo" })
    m2 = new AnotherModel({ name : "foo" })
    d.add_root(m)
    d.add_root(m2)
    got_error = false
    try
      d.get_model_by_name('foo')
    catch e
      got_error = true
      expect(e.message).to.include('Multiple models')
    expect(got_error).to.equal(true)

  # TODO copy the following tests from test_document.py here
  # TODO(havocp) test_all_models_with_multiple_references
  # TODO(havocp) test_all_models_with_cycles
  # TODO(havocp) test_change_notification
  # TODO(havocp) test_change_notification_removal
  # TODO(havocp) test_notification_of_roots
  # TODO(havocp) test_notification_of_title
  # TODO(havocp) test_clear

  it "can serialize with one model in it", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    root1 = new SomeModel()
    d.add_root(root1)
    expect(d.roots().length).to.equal 1
    d.set_title("Foo")

    json = d.to_json_string()
    copy = Document.from_json_string(json)

    expect(copy.roots().length).to.equal 1
    expect(copy.roots()[0]).to.be.an.instanceof(SomeModel)
    expect(copy.title()).to.equal "Foo"

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

  it "sets proper document on models added during construction", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(Object.keys(d._all_models).length).to.equal 0

    root1 = new ModelWithConstructTimeChanges()
    # change it so it doesn't match what initialize() does
    root1.set({ foo: 3, child: null })
    d.add_root(root1)

    json = d.to_json_string()
    copy = Document.from_json_string(json)

    root1_copy = copy.get_model_by_id(root1.id)

    expect(root1.get('foo')).to.equal 3
    expect(root1.get('child')).to.equal null

    # when unpacking the copy, initialize() was supposed to overwrite
    # what we unpacked.
    expect(root1_copy.get('foo')).to.equal 4
    expect(root1_copy.get('child')).to.be.an.instanceof(AnotherModel)
    expect(root1_copy.document).to.equal copy
    expect(root1_copy.get('child').document).to.equal copy

  it "computes patch for models added during construction", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(Object.keys(d._all_models).length).to.equal 0

    root1 = new ModelWithConstructTimeChanges()
    # change it so it doesn't match what initialize() does
    root1.set({ foo: 3, child: null })
    d.add_root(root1)

    json = d.to_json_string()
    copy = Document.from_json_string(json)

    patch = Document._compute_patch_since_json(JSON.parse(json), copy)

    expect(patch.events.length).to.equal 2
    expect(root1.get('foo')).to.equal 3
    expect(root1.get('child')).to.equal null
    d.apply_json_patch(patch)
    expect(root1.get('foo')).to.equal 4
    expect(root1.get('child')).to.be.an.instanceof(AnotherModel)

  it "computes complicated patch for models added during construction", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(Object.keys(d._all_models).length).to.equal 0

    root1 = new ComplicatedModelWithConstructTimeChanges()
    # change it so it doesn't match what initialize() does
    for k of root1.attributes
      delete root1.attributes[k]
    d.add_root(root1)

    json = d.to_json_string()
    copy = Document.from_json_string(json)

    patch = Document._compute_patch_since_json(JSON.parse(json), copy)

    expect(root1.get('name')).to.equal undefined
    expect(root1.get('list_prop')).to.equal undefined
    expect(root1.get('dict_prop')).to.equal undefined
    expect(root1.get('obj_prop')).to.equal undefined
    expect(root1.get('dict_of_list_prop')).to.equal undefined

    expect(patch.events.length).to.equal 5

    d.apply_json_patch(patch)
    expect(root1.get('name')).to.equal null
    expect(root1.get('list_prop').length).to.equal 1
    expect(Object.keys(root1.get('dict_prop')).length).to.equal 1
    expect(root1.get('obj_prop')).to.be.an.instanceof(ModelWithConstructTimeChanges)
    expect(root1.get('obj_prop').get('child')).to.be.an.instanceof(AnotherModel)
    expect(Object.keys(root1.get('dict_of_list_prop')).length).to.equal 1
    expect(_.values(root1.get('dict_of_list_prop'))[0].length).to.equal 1
