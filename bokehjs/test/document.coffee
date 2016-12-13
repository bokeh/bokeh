_ = require "underscore"
{expect} = require "chai"
utils = require "./utils"
sinon = require "sinon"
{ stdoutTrap, stderrTrap } = require 'logtrap'

{Document, ModelChangedEvent, TitleChangedEvent, RootAddedEvent, RootRemovedEvent, DEFAULT_TITLE} = utils.require "document"
{GE, Strength, Variable}  = utils.require "core/layout/solver"
js_version = utils.require("version").version
{Models} = utils.require "base"
{Model} = utils.require "model"
{Layoutable} = utils.require "models/layouts/layoutable"
logging = utils.require "core/logging"
p = utils.require "core/properties"

class AnotherModel extends Model
  type: 'AnotherModel'

  @define {
    bar: [ p.Number, 1 ]
  }

Models.register('AnotherModel', AnotherModel)

class SomeModel extends Model
  type: 'SomeModel'

  @define {
    foo:   [ p.Number, 2 ]
    child: [ p.Instance, null ]
  }

Models.register('SomeModel', SomeModel)

class SomeModelWithChildren extends Model
  type: 'SomeModelWithChildren'

  @define {
    children: [ p.Array, [] ]
  }

Models.register('SomeModelWithChildren', SomeModelWithChildren)

class ModelWithConstructTimeChanges extends Model
  type: 'ModelWithConstructTimeChanges'

  initialize: (attributes, options) ->
    super(attributes, options)
    @foo = 4
    @child = new AnotherModel()

  @define {
    foo:   [ p.Number, 2 ]
    child: [ p.Instance, null ]
  }

Models.register('ModelWithConstructTimeChanges', ModelWithConstructTimeChanges)

class ComplicatedModelWithConstructTimeChanges extends Model
  type: 'ComplicatedModelWithConstructTimeChanges'

  initialize: (attributes, options) ->
    super(attributes, options)
    @list_prop = [new AnotherModel()]
    @dict_prop = { foo: new AnotherModel() }
    @obj_prop = new ModelWithConstructTimeChanges()
    @dict_of_list_prop = { foo: [new AnotherModel()] }

  @define {
    list_prop:         [ p.Array ]
    dict_prop:         [ p.Any ]
    obj_prop:          [ p.Instance ]
    dict_of_list_prop: [ p.Any ]
  }

Models.register('ComplicatedModelWithConstructTimeChanges', ComplicatedModelWithConstructTimeChanges)


class LayoutableModel extends Layoutable
  type: 'LayoutableModel'

  get_constraints: () ->
    []

  get_edit_variables: () ->
    []

  get_constrained_variables: () ->
    {}
Models.register('LayoutableModel', LayoutableModel)

class ModelWithConstraint extends LayoutableModel
  type: 'ModelWithConstraint'

  constructor: (attrs, options) ->
    super(attrs, options)
    @_left = new Variable('ModelWithConstraint._left')

  get_constraints: () ->
    constraints = []
    constraints.push(GE(@_left))
    return constraints

Models.register('ModelWithConstraint', ModelWithConstraint)


class ModelWithEditVariable extends LayoutableModel
  type: 'ModelWithEditVariable'

  constructor: (attrs, options) ->
    super(attrs, options)
    @_left = new Variable('ModelWithEditVariable._left')

  get_edit_variables: () ->
    editables = []
    editables.push({edit_variable: @_left, strength: Strength.strong})
    return editables

Models.register('ModelWithEditVariable', ModelWithEditVariable)

class ModelWithConstrainedVariables extends LayoutableModel
  type: 'ModelWithConstrainedVariables'

  constructor: (attrs, options) ->
    super(attrs, options)
    @_width = new Variable()
    @_height = new Variable()

  get_constrained_variables: () ->
    return {
      width: @_width
      height: @_height
    }

  @define {
    sizing_mode: [ p.SizingMode, 'scale_width']
  }

Models.register('ModelWithConstrainedVariables', ModelWithConstrainedVariables)

class ModelWithConstrainedWidthVariable extends LayoutableModel
  type: 'ModelWithConstrainedWidthVariable'

  constructor: (attrs, options) ->
    super(attrs, options)
    @_width = new Variable()

  get_constrained_variables: () ->
    return {
      width: @_width
    }

  @define {
    sizing_mode: [ p.SizingMode, 'scale_width']
  }

Models.register('ModelWithConstrainedWidthVariable', ModelWithConstrainedWidthVariable)


class ModelWithConstrainedHeightVariable extends LayoutableModel
  type: 'ModelWithConstrainedHeightVariable'

  constructor: (attrs, options) ->
    super(attrs, options)
    @_height = new Variable()

  get_constrained_variables: () ->
    return {
      height: @_height
    }

  @define {
    sizing_mode: [ p.SizingMode, 'scale_width']
  }

Models.register('ModelWithConstrainedHeightVariable', ModelWithConstrainedHeightVariable)

class ModelWithEditVariableAndConstraint extends LayoutableModel
  type: 'ModelWithEditVariableAndConstraint'

  constructor: (attrs, options) ->
    super(attrs, options)
    @_left = new Variable('ModelWithEditVariableAndConstraint._left')

  get_edit_variables: () ->
    editables = []
    editables.push({edit_variable: @_left, strength: Strength.strong})
    return editables

  get_constraints: () ->
    constraints = []
    constraints.push(GE(@_left))
    return constraints

Models.register('ModelWithEditVariableAndConstraint', ModelWithEditVariableAndConstraint)


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
    m.child = m2
    expect(m.child).to.equal m2
    d.add_root(m)
    expect(d.roots().length).to.equal 1
    expect(Object.keys(d._all_models).length).to.equal 2

    m.child = null
    expect(Object.keys(d._all_models).length).to.equal 1
    m.child = m2
    expect(Object.keys(d._all_models).length).to.equal 2
    d.remove_root(m)
    expect(d.roots().length).to.equal 0
    expect(Object.keys(d._all_models).length).to.equal 0

  it "tracks all_models with list property", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(Object.keys(d._all_models).length).to.equal 0
    m = new SomeModelWithChildren()
    m2 = new AnotherModel()
    m.children = [m2]
    expect(m.children).to.deep.equal [ m2 ]
    # check that we get the right all_models on initial add_root
    d.add_root(m)
    expect(d.roots().length).to.equal 1
    expect(Object.keys(d._all_models).length).to.equal 2

    # check that removing children list drops the models beneath it
    m.children = []
    expect(Object.keys(d._all_models).length).to.equal 1

    # check that adding children back re-adds the models
    m.children = [m2]
    expect(Object.keys(d._all_models).length).to.equal 2

    # check that removing root removes the models
    d.remove_root(m)
    expect(d.roots().length).to.equal 0
    expect(Object.keys(d._all_models).length).to.equal 0

  it "tracks all_models with list property where list elements have a child", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(Object.keys(d._all_models).length).to.equal 0
    m = new SomeModelWithChildren()
    m3 = new AnotherModel()
    m2 = new SomeModel({ child: m3 })
    m.children = [m2]
    expect(m.children).to.deep.equal [ m2 ]

    # check that we get the right all_models on initial add_root
    d.add_root(m)
    expect(d.roots().length).to.equal 1
    expect(Object.keys(d._all_models).length).to.equal 3

    # check that removing children list drops the models beneath it
    m.children = []
    expect(Object.keys(d._all_models).length).to.equal 1

    # check that adding children back re-adds the models
    m.children = [m2]
    expect(Object.keys(d._all_models).length).to.equal 3

    # check that removing root removes the models
    d.remove_root(m)
    expect(d.roots().length).to.equal 0
    expect(Object.keys(d._all_models).length).to.equal 0

  it "lets us get_model_by_id", ->
    d = new Document()
    m = new SomeModel()
    m2 = new AnotherModel()
    m.child = m2
    d.add_root(m)
    expect(d.get_model_by_id(m.id)).to.equal(m)
    expect(d.get_model_by_id(m2.id)).to.equal(m2)
    expect(d.get_model_by_id("invalidid")).to.equal(null)

  it "lets us get_model_by_name", ->
    d = new Document()
    m = new SomeModel({ name : "foo" })
    m2 = new AnotherModel({ name : "bar" })
    m.child = m2
    d.add_root(m)
    expect(d.get_model_by_name(m.name)).to.equal(m)
    expect(d.get_model_by_name(m2.name)).to.equal(m2)
    expect(d.get_model_by_name("invalidid")).to.equal(null)

  it "lets us get_model_by_name after changing name", ->
    d = new Document()
    m = new SomeModel({ name : "foo" })
    d.add_root(m)
    expect(d.get_model_by_name("foo")).to.equal(m)
    expect(d.get_model_by_name("bar")).to.equal(null)
    m.name = "bar"
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

  it "can have all_models with multiple references", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(_.size(d._all_models)).to.equal 0

    root1 = new SomeModel()
    root2 = new SomeModel()
    child1 = new AnotherModel()
    root1.child = child1
    root2.child = child1
    d.add_root(root1)
    d.add_root(root2)
    expect(d.roots().length).to.equal 2
    expect(_.size(d._all_models)).to.equal 3

    root1.child = null
    expect(_.size(d._all_models)).to.equal 3

    root2.child = null
    expect(_.size(d._all_models)).to.equal 2

    root1.child = child1
    expect(_.size(d._all_models)).to.equal 3

    root2.child = child1
    expect(_.size(d._all_models)).to.equal 3

    d.remove_root(root1)
    expect(_.size(d._all_models)).to.equal 2

    d.remove_root(root2)
    expect(_.size(d._all_models)).to.equal 0

  it "can have all_models with cycles", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(_.size(d._all_models)).to.equal 0

    root1 = new SomeModel()
    root2 = new SomeModel()
    child1 = new SomeModel()
    root1.child = child1
    root2.child = child1
    child1.child = root1
    d.add_root(root1)
    d.add_root(root2)
    expect(d.roots().length).to.equal 2
    expect(_.size(d._all_models)).to.equal 3

    root1.child = null
    expect(_.size(d._all_models)).to.equal 3

    root2.child = null
    expect(_.size(d._all_models)).to.equal 2

    root1.child = child1
    expect(_.size(d._all_models)).to.equal 3

  it "can have all_models with cycles through lists", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(_.size(d._all_models)).to.equal 0

    root1 = new SomeModelWithChildren()
    root2 = new SomeModelWithChildren()
    child1 = new SomeModelWithChildren()
    root1.children = [child1]
    root2.children = [child1]
    child1.children = [root1]
    d.add_root(root1)
    d.add_root(root2)
    expect(d.roots().length).to.equal 2
    expect(_.size(d._all_models)).to.equal 3

    root1.children = []
    expect(_.size(d._all_models)).to.equal 3

    root2.children = []
    expect(_.size(d._all_models)).to.equal 2

    root1.children = [child1]
    expect(_.size(d._all_models)).to.equal 3

  it "can notify on changes", ->
    d = new Document()
    expect(d.roots().length).to.equal 0

    m = new AnotherModel()

    d.add_root(m)
    expect(d.roots().length).to.equal 1
    expect(m.bar).to.equal 1

    events = []
    curdoc_from_listener = []
    listener = (event) ->
      events.push(event)
    d.on_change(listener)

    m.bar = 42
    expect(events.length).to.equal 1
    expect(events[0]).is.instanceof ModelChangedEvent
    expect(events[0].document).to.equal d
    expect(events[0].model).to.equal m
    expect(events[0].attr).to.equal 'bar'
    expect(events[0].old).to.equal 1
    expect(events[0].new_).to.equal 42

  it "can remove notification changes", ->
    d = new Document()
    expect(d.roots().length).to.equal 0

    m = new AnotherModel()

    d.add_root(m)
    expect(d.roots().length).to.equal 1
    expect(m.bar).to.equal 1

    events = []
    listener = (event) ->
      events.push(event)
    d.on_change(listener)

    m.bar = 42

    expect(events.length).to.equal 1
    expect(events[0].new_).to.equal 42

    d.remove_on_change(listener)
    m.bar = 43

    expect(events.length).to.equal 1

  it "should notify on roots change", ->
    d = new Document()
    expect(d.roots().length).to.equal 0

    events = []
    listener = (event) ->
      events.push(event)
    d.on_change(listener)

    m = new AnotherModel({bar:1})
    d.add_root(m)
    expect(d.roots().length).to.equal 1
    expect(events.length).to.equal 1
    expect(events[0]).is.instanceof RootAddedEvent
    expect(events[0].model).to.equal m

    m2 = new AnotherModel({bar:2})
    d.add_root(m2)
    expect(d.roots().length).to.equal 2
    expect(events.length).to.equal 2
    expect(events[1]).is.instanceof RootAddedEvent
    expect(events[1].model).to.equal m2

    d.remove_root(m)
    expect(d.roots().length).to.equal 1
    expect(events.length).to.equal 3
    expect(events[2]).is.instanceof RootRemovedEvent
    expect(events[2].model).to.equal m

    d.remove_root(m2)
    expect(d.roots().length).to.equal 0
    expect(events.length).to.equal 4
    expect(events[3]).is.instanceof RootRemovedEvent
    expect(events[3].model).to.equal m2

  it "should notify on title change", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(d.title()).to.equal DEFAULT_TITLE

    events = []
    listener = (event) ->
      events.push(event)
    d.on_change(listener)

    d.set_title('Foo')
    expect(d.title()).to.equal 'Foo'
    expect(events.length).to.equal 1
    expect(events[0]).is.instanceof TitleChangedEvent
    expect(events[0].document).to.equal d
    expect(events[0].title).to.equal 'Foo'

  it "can clear", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(d.title()).to.equal DEFAULT_TITLE
    d.add_root(new AnotherModel())
    d.add_root(new AnotherModel())
    d.set_title('Foo')
    expect(d.roots().length).to.equal 2
    expect(d.title()).to.equal 'Foo'
    d.clear()
    expect(d.roots().length).to.equal 0
    expect(_.size(d._all_models)).to.equal 0
    # does not reset title
    expect(d.title()).to.equal 'Foo'

  it "throws on destructive move of itself", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(d.title()).to.equal DEFAULT_TITLE
    d.add_root(new AnotherModel())
    d.add_root(new AnotherModel())
    d.set_title('Foo')
    expect(d.roots().length).to.equal 2
    expect(d.title()).to.equal 'Foo'
    try
      d.destructively_move(d)
    catch e
      got_error = true
      expect(e.message).to.include('Attempted to overwrite a document with itself')
    expect(got_error).to.equal(true)

it "can destructively move", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(d.title()).to.equal DEFAULT_TITLE
    d.add_root(new AnotherModel())
    d.add_root(new AnotherModel())
    d.set_title('Foo')
    expect(d.roots().length).to.equal 2
    expect(d.title()).to.equal 'Foo'

    d2 = new Document()
    expect(d2.roots().length).to.equal 0
    expect(d2.title()).to.equal DEFAULT_TITLE
    d2.add_root(new SomeModel())
    d2.set_title('Bar')
    expect(d2.roots().length).to.equal 1
    expect(d2.title()).to.equal 'Bar'

    d2.destructively_move(d)
    expect(d.roots().length).to.equal 1
    expect(d.roots()[0].foo).to.equal 2
    expect(d.title()).to.equal 'Bar'

    expect(d2.roots().length).to.equal 0

  it "checks for versions matching", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    root1 = new SomeModel()
    d.add_root(root1)
    expect(d.roots().length).to.equal 1
    d.set_title("Foo")

    old_log_level = logging.logger.level.name
    logging.set_log_level("warn")
    json = d.to_json_string()
    parsed = JSON.parse(json)
    parsed['version'] = "#{js_version}"
    out = stderrTrap -> Document.from_json_string(JSON.stringify(parsed))
    expect(out).to.be.equal ""

    parsed['version'] = "0.0.1"
    out = stderrTrap -> Document.from_json_string(JSON.stringify(parsed))
    expect(out).to.be.equal "[bokeh] JS/Python version mismatch\n[bokeh] Library versions: JS (#{js_version})  /  Python (#{parsed["version"]})\n"

    parsed['version'] = "#{js_version}rc123"
    out = stderrTrap -> Document.from_json_string(JSON.stringify(parsed))
    expect(out).to.be.equal "[bokeh] JS/Python version mismatch\n[bokeh] Library versions: JS (#{js_version})  /  Python (#{parsed["version"]})\n"

    parsed['version'] = "#{js_version}dev123"
    out = stderrTrap -> Document.from_json_string(JSON.stringify(parsed))
    expect(out).to.be.equal "[bokeh] JS/Python version mismatch\n[bokeh] Library versions: JS (#{js_version})  /  Python (#{parsed["version"]})\n"

    parsed['version'] = "#{js_version}-foo"
    out = stderrTrap -> Document.from_json_string(JSON.stringify(parsed))
    expect(out).to.be.equal ""

    parsed['version'] = "#{js_version}rc123-foo"
    out = stderrTrap -> Document.from_json_string(JSON.stringify(parsed))
    expect(out).to.be.equal ""

    parsed['version'] = "#{js_version}dev123-bar"
    out = stderrTrap -> Document.from_json_string(JSON.stringify(parsed))
    expect(out).to.be.equal ""

    # need to reset old log level
    logging.set_log_level(old_log_level)

  it "can serialize with one model in it", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    root1 = new SomeModel()
    d.add_root(root1)
    expect(d.roots().length).to.equal 1
    d.set_title("Foo")

    json = d.to_json_string()
    parsed = JSON.parse(json)
    parsed['version'] = js_version
    copy = Document.from_json_string(JSON.stringify(parsed))

    expect(copy.roots().length).to.equal 1
    expect(copy.roots()[0]).to.be.an.instanceof(SomeModel)
    expect(copy.title()).to.equal "Foo"

  it "can serialize excluding defaults", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    root1 = new SomeModel()
    root1.name = 'bar'
    d.add_root(root1)
    expect(d.roots().length).to.equal 1

    json = d.to_json_string(include_defaults=false)
    parsed = JSON.parse(json)
    parsed['version'] = js_version
    copy = Document.from_json_string(JSON.stringify(parsed))

    expect(copy.roots().length).to.equal 1
    expect(copy.roots()[0]).to.be.an.instanceof(SomeModel)
    expect(copy.roots()[0].name).to.be.equal 'bar'

    # be sure defaults were NOT included
    attrs = parsed['roots']['references'][0]['attributes']
    expect('tags' of attrs).to.be.equal false
    expect('foo' of attrs).to.be.equal false
    expect('child' of attrs).to.be.equal false
    # this should be included, non-default
    expect('name' of attrs).to.be.equal true

    # double-check different results if we do include_defaults
    parsed_with_defaults = JSON.parse(d.to_json_string(include_defaults=true))
    attrs = parsed_with_defaults['roots']['references'][0]['attributes']
    #expect('tags' of attrs).to.be.equal true
    expect('foo' of attrs).to.be.equal true
    expect('child' of attrs).to.be.equal true
    expect('name' of attrs).to.be.equal true

  # TODO copy the following tests from test_document.py here
  # TODO(havocp) test_serialization_more_models

  it "can patch an integer property", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(Object.keys(d._all_models).length).to.equal 0

    root1 = new SomeModel({ foo: 42 })
    root2 = new SomeModel({ foo: 43 })
    child1 = new SomeModel({ foo: 44 })
    root1.setv({ child: child1 })
    root2.setv({ child: child1 })
    d.add_root(root1)
    d.add_root(root2)
    expect(d.roots().length).to.equal 2

    event1 = new ModelChangedEvent(d, root1, 'foo', root1.foo, 57)
    patch1 = d.create_json_patch_string([event1])
    d.apply_json_patch_string(patch1)

    expect(root1.foo).to.equal 57

    event2 = new ModelChangedEvent(d, child1, 'foo', child1.foo, 67)
    patch2 = d.create_json_patch_string([event2])
    d.apply_json_patch_string(patch2)

    expect(child1.foo).to.equal 67

  it "can patch a reference property", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(Object.keys(d._all_models).length).to.equal 0

    root1 = new SomeModel({ foo: 42 })
    root2 = new SomeModel({ foo: 43 })
    child1 = new SomeModel({ foo: 44 })
    child2 = new SomeModel({ foo: 45 })
    child3 = new SomeModel({ foo: 46, child: child2})
    root1.setv({ child: child1 })
    root2.setv({ child: child1 })
    d.add_root(root1)
    d.add_root(root2)
    expect(d.roots().length).to.equal 2

    expect(d._all_models).to.have.property(child1.id)
    expect(d._all_models).to.not.have.property(child2.id)
    expect(d._all_models).to.not.have.property(child3.id)

    event1 = new ModelChangedEvent(d, root1, 'child', root1.child, child3)
    patch1 = d.create_json_patch_string([event1])
    d.apply_json_patch_string(patch1)

    expect(root1.child.id).to.equal child3.id
    expect(root1.child.child.id).to.equal child2.id
    expect(d._all_models).to.have.property(child1.id)
    expect(d._all_models).to.have.property(child2.id)
    expect(d._all_models).to.have.property(child3.id)

    # put it back how it was before
    event2 = new ModelChangedEvent(d, root1, 'child', child1.child, child1)
    patch2 = d.create_json_patch_string([event2])
    d.apply_json_patch_string(patch2)

    expect(root1.child.id).to.equal child1.id
    expect(root1.child.child).to.be.equal null
    expect(d._all_models).to.have.property(child1.id)
    expect(d._all_models).to.not.have.property(child2.id)
    expect(d._all_models).to.not.have.property(child3.id)

  it "can patch two properties at once", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(Object.keys(d._all_models).length).to.equal 0

    root1 = new SomeModel({ foo: 42 })
    child1 = new SomeModel({ foo: 43 })
    root1.setv({ child: child1 })
    d.add_root(root1)
    expect(d.roots().length).to.equal 1

    child2 = new SomeModel({ foo: 44 })

    event1 = new ModelChangedEvent(d, root1, 'foo', root1.foo, 57)
    event2 = new ModelChangedEvent(d, root1, 'child', root1.child, child2)
    patch1 = d.create_json_patch_string([event1, event2])
    d.apply_json_patch_string(patch1)


    expect(root1.foo).to.equal 57
    expect(root1.child.foo).to.be.equal 44

  it "sets proper document on models added during patching", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(Object.keys(d._all_models).length).to.equal 0

    root1 = new SomeModel({ foo: 42 })
    child1 = new SomeModel({ foo: 44 })
    d.add_root(root1)
    expect(d.roots().length).to.equal 1

    # can't create copy of doc here like other test. Testing explicitly that
    # doc attach happens when *not* creating a new document (i.e only patching)
    # Testing only for/against null .document is not the strongest test but it
    # should suffice.

    expect(root1.document.roots().length).equal 1
    expect(root1.child).to.equal null

    event1 = new ModelChangedEvent(d, root1, 'child', root1.child, child1)
    patch1 = d.create_json_patch_string([event1])
    d.apply_json_patch_string(patch1)

    expect(root1.document.roots().length).equal 1
    expect(root1.child.document.roots().length).equal 1

  it "sets proper document on models added during construction", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(Object.keys(d._all_models).length).to.equal 0

    root1 = new ModelWithConstructTimeChanges()
    # change it so it doesn't match what initialize() does
    root1.foo = 3
    root1.child = null
    d.add_root(root1)

    json = d.to_json_string()
    parsed = JSON.parse(json)
    parsed['version'] = js_version
    copy = Document.from_json_string(JSON.stringify(parsed))

    root1_copy = copy.get_model_by_id(root1.id)

    expect(root1.foo).to.equal 3
    expect(root1.child).to.equal null

    # when unpacking the copy, initialize() was supposed to overwrite
    # what we unpacked.
    expect(root1_copy.foo).to.equal 4
    expect(root1_copy.child).to.be.an.instanceof(AnotherModel)
    expect(root1_copy.document).to.equal copy
    expect(root1_copy.child.document).to.equal copy

  it "computes patch for models added during construction", ->
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(Object.keys(d._all_models).length).to.equal 0

    root1 = new ModelWithConstructTimeChanges()
    # change it so it doesn't match what initialize() does
    root1.foo = 3
    root1.child = null
    d.add_root(root1)

    json = d.to_json_string()
    parsed = JSON.parse(json)
    parsed['version'] = js_version
    copy = Document.from_json_string(JSON.stringify(parsed))

    patch = Document._compute_patch_since_json(JSON.parse(json), copy)

    expect(patch.events.length).to.equal 2
    expect(root1.foo).to.equal 3
    expect(root1.child).to.equal null
    d.apply_json_patch(patch)
    expect(root1.foo).to.equal 4
    expect(root1.child).to.be.an.instanceof(AnotherModel)

  it "computes complicated patch for models added during construction", ->
    # this test simulates how from_json has to compute changes
    # to send back to the server, when the client side makes
    # changes while constructing the parsed document.
    d = new Document()
    expect(d.roots().length).to.equal 0
    expect(Object.keys(d._all_models).length).to.equal 0

    root1 = new ComplicatedModelWithConstructTimeChanges()
    # change it so it doesn't match what initialize() does
    serialized_values = {
      'name' : 'foo',
      'tags' : ['bar'],
      'list_prop' : [new AnotherModel({ 'bar' : 42 })],
      'dict_prop' : { foo: new AnotherModel({ 'bar' : 43 }) },
      'obj_prop' : new ModelWithConstructTimeChanges(),
      'dict_of_list_prop' : { foo: [new AnotherModel({ 'bar' : 44 })] }
      }
    root1.setv(serialized_values)

    d.add_root(root1)

    # in computing this, we will construct a
    # ComplicatedModelWithConstructTimeChanges which will set
    # stuff in initialize(), overwriting serialized_values above.
    json = d.to_json_string()
    parsed = JSON.parse(json)
    parsed['version'] = js_version
    copy = Document.from_json_string(JSON.stringify(parsed))

    patch = Document._compute_patch_since_json(JSON.parse(json), copy)

    # document should have the values we set above
    for own key, value of serialized_values
      expect(root1.getv(key)).to.deep.equal value
    expect(root1.list_prop[0].bar).to.equal 42
    expect(root1.dict_prop['foo'].bar).to.equal 43

    expect(patch.events.length).to.equal 4

    # but when we apply the patch, initialize() should override
    # what we had in the json only for the four things that
    # ComplicatedModelWithConstructTimeChanges changes (not name
    # and tags)
    d.apply_json_patch(patch)
    expect(root1.name).to.equal 'foo'
    expect(root1.tags).to.deep.equal ['bar']
    expect(root1.list_prop.length).to.equal 1
    expect(root1.list_prop[0].bar).to.equal 1
    expect(Object.keys(root1.dict_prop).length).to.equal 1
    expect(root1.dict_prop['foo'].bar).to.equal 1
    expect(root1.obj_prop).to.be.an.instanceof(ModelWithConstructTimeChanges)
    expect(root1.obj_prop.child).to.be.an.instanceof(AnotherModel)
    expect(Object.keys(root1.dict_of_list_prop).length).to.equal 1
    expect(_.values(root1.dict_of_list_prop)[0].length).to.equal 1

  it "adds two constraints and two edit_variables on instantiation solver", ->
    d = new Document()
    s = d.solver()
    expect(s.num_constraints()).to.equal 2
    expect(s.num_edit_variables()).to.equal 2

  it "adds edit_variables of root to solver", ->
    d = new Document()
    s = d.solver()
    expect(d.roots().length).to.equal 0
    expect(s.num_constraints()).to.equal 2
    expect(s.num_edit_variables()).to.equal 2

    d.add_root(new ModelWithEditVariable())
    expect(d.roots().length).to.equal 1

    # Check state of solver
    expect(s.num_edit_variables()).to.equal 3
    expect(s.num_constraints()).to.equal 3
    expect(s.solver._editMap._array['2'].first._name).to.equal 'ModelWithEditVariable._left'
    expect(s.solver._editMap._array['2'].second.constraint._strength).to.equal Strength.strong

  it "adds constraints of root to solver", ->
    d = new Document()
    s = d.solver()
    expect(d.roots().length).to.equal 0
    expect(s.num_constraints()).to.equal 2
    expect(s.num_edit_variables()).to.equal 2

    d.add_root(new ModelWithConstraint())
    expect(d.roots().length).to.equal 1

    # Check state of solver
    expect(s.num_edit_variables()).to.equal 2
    expect(s.num_constraints()).to.equal 3
    expect(s.solver._cnMap._array['2'].first._expression._terms._array['0'].first._name).to.equal 'ModelWithConstraint._left'

  it "adds constraints and edit variable of root to solver", ->
    d = new Document()
    s = d.solver()
    expect(d.roots().length).to.equal 0
    expect(s.num_constraints()).to.equal 2
    expect(s.num_edit_variables()).to.equal 2

    d.add_root(new ModelWithEditVariableAndConstraint())
    expect(d.roots().length).to.equal 1

    # Check state of solver
    expect(s.num_edit_variables()).to.equal 3
    expect(s.num_constraints()).to.equal 4

  it "adds one constraint on add_root if model has get_constrained_variables width", ->
    d = new Document()
    s = d.solver()
    expect(d.roots().length).to.equal 0

    before_constraints = s.num_constraints()

    expect(s.num_edit_variables()).to.equal 2
    d.add_root(new ModelWithConstrainedWidthVariable())

    expect(d.roots().length).to.equal 1
    expect(s.num_constraints()).to.equal before_constraints + 1

  it "adds one constraints on add_root if model has get_constrained_variables height and sizing_mode is stretch_both", ->
    d = new Document()
    s = d.solver()
    expect(d.roots().length).to.equal 0

    before_constraints = s.num_constraints()

    expect(s.num_edit_variables()).to.equal 2
    d.add_root(new ModelWithConstrainedHeightVariable({sizing_mode: 'stretch_both'}))

    expect(d.roots().length).to.equal 1
    expect(s.num_constraints()).to.equal before_constraints + 1

  it "adds no new constraints on add_root if model has no get_constrained_variables", ->
    d = new Document()
    s = d.solver()
    expect(d.roots().length).to.equal 0

    before_constraints = s.num_constraints()

    expect(s.num_edit_variables()).to.equal 2
    d.add_root(new SomeModel())

    expect(d.roots().length).to.equal 1
    expect(s.num_constraints()).to.equal before_constraints

  it "adds two constraints on add_root if model has get_constrained_variables width & height and sizing_mode is 'stretch_both'", ->
    d = new Document()
    s = d.solver()
    expect(d.roots().length).to.equal 0

    before_constraints = s.num_constraints()

    expect(s.num_edit_variables()).to.equal 2
    d.add_root(new ModelWithConstrainedVariables({sizing_mode: 'stretch_both'}))

    expect(d.roots().length).to.equal 1
    expect(s.num_constraints()).to.equal before_constraints + 2

  it "add_root calls update_variables on solver", ->
    d = new Document()
    s = d.solver()
    spy = sinon.spy(s, 'update_variables')
    d.add_root(new ModelWithEditVariableAndConstraint())
    expect(spy.calledOnce).is.true

  # TODO(bird) - We're not using window - so need to find a new
  # way to test the size was set correctly.
  it.skip "resize suggests value for width and height of document", ->
    d = new Document()
    s = d.solver()
    spy = sinon.spy(s, 'suggest_value')
    root_model = new ModelWithConstrainedVariables()
    d.add_root(root_model)
    d.resize()
    expect(spy.calledTwice).is.true
    expect(spy.calledWithExactly(d._doc_height, window.innerHeight - 30), 'suggest_value was not called with window.innerHeight').is.true
    expect(spy.calledWithExactly(d._doc_width, window.innerWidth - 50), 'suggest_value was not called with window.innerWidth - 50').is.true

  it "resize method's height and width args are passed to _solver.suggest_value", ->
    d = new Document()
    s = d.solver()
    spy = sinon.spy(s, 'suggest_value')
    root_model = new ModelWithConstrainedVariables({sizing_mode: "scale_both"})
    d.add_root(root_model)
    d.resize(200, 300)
    expect(spy.callCount).is.equal(4)
    expect(spy.calledWithExactly(d._doc_width, 200)).is.true
    expect(spy.calledWithExactly(d._doc_height, 300)).is.true

  it "resize calls suggest_value once for one root with width", ->
    d = new Document()
    spy = sinon.spy(d.solver(), 'suggest_value')
    d.add_root(new ModelWithConstrainedWidthVariable())
    d.resize()
    expect(spy.calledTwice).is.true  # NOTE double amount, for now

  it "resize calls suggest_value once for one root with height", ->
    d = new Document()
    spy = sinon.spy(d.solver(), 'suggest_value')
    d.add_root(new ModelWithConstrainedHeightVariable())
    d.resize()
    expect(spy.calledTwice).is.true  # NOTE double amount, for now

  it "resize calls suggest_value twice for one root with width & height", ->
    d = new Document()
    spy = sinon.spy(d.solver(), 'suggest_value')
    d.add_root(new ModelWithConstrainedVariables())
    d.resize()
    expect(spy.callCount).to.be.equal 4  # NOTE double amount, for now

  it "resize calls suggest_value four times for two roots with width & height", ->
    d = new Document()
    spy = sinon.spy(d.solver(), 'suggest_value')
    d.add_root(new ModelWithConstrainedVariables())
    d.add_root(new ModelWithConstrainedVariables())
    d.resize()
    expect(spy.callCount).to.be.equal 8  # NOTE double amount, for now

  it "resize does not call suggest value if root is not a layoutable", ->
    d = new Document()
    spy = sinon.spy(d.solver(), 'suggest_value')
    d.add_root(new SomeModel())
    d.resize()
    expect(spy.called).is.false

  it "resize calls update_variables on solver with false", ->
    d = new Document()
    root_model = new ModelWithConstrainedVariables()
    d.add_root(root_model)
    s = d.solver()
    spy = sinon.spy(s, 'update_variables')
    d.resize()
    expect(spy.calledTwice, 'update_variables was not called').is.true  # NOTE double amount, for now
    expect(spy.calledWith(false), 'update_variables was not called with false').is.true

  it "resize triggers resize event on solver", ->
    d = new Document()
    root_model = new ModelWithConstrainedVariables()
    d.add_root(root_model)
    s = d.solver()
    spy = sinon.spy(s, 'trigger')
    d.resize()
    expect(spy.calledTwice).is.true  # NOTE double amount, for now
    expect(spy.calledWith('resize')).is.true
