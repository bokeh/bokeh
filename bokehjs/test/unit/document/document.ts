import {expect} from "assertions"
import * as sinon from "sinon"

import {assert} from "@bokehjs/core/util/assert"
import {values, entries} from "@bokehjs/core/util/object"
import {Document, DEFAULT_TITLE} from "@bokehjs/document"
import * as ev from "@bokehjs/document/events"
import {version as js_version} from "@bokehjs/version"
import {Models} from "@bokehjs/base"
import {Model} from "@bokehjs/model"
import * as logging from "@bokehjs/core/logging"
import * as p from "@bokehjs/core/properties"

import {trap} from "../../util"

namespace AnotherModel {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    bar: p.Property<number>
  }
}

interface AnotherModel extends AnotherModel.Attrs {}

class AnotherModel extends Model {
  properties: AnotherModel.Props

  constructor(attrs?: Partial<AnotherModel.Attrs>) {
    super(attrs)
  }

  static init_AnotherModel(): void {
    this.define<AnotherModel.Props>({
      bar: [ p.Number, 1 ],
    })
  }
}

Models.register('AnotherModel', AnotherModel)

namespace SomeModel {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    foo: p.Property<number>
    child: p.Property<Model | null>
  }
}

interface SomeModel extends SomeModel.Attrs {}

class SomeModel extends Model {
  properties: SomeModel.Props

  constructor(attrs?: Partial<SomeModel.Attrs>) {
    super(attrs)
  }

  static init_SomeModel(): void {

    this.define<SomeModel.Props>({
      foo:   [ p.Number, 2 ],
      child: [ p.Instance, null ],
    })
  }
}

Models.register('SomeModel', SomeModel)

namespace SomeModelWithChildren {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    children: p.Property<Model[]>
  }
}

interface SomeModelWithChildren extends SomeModelWithChildren.Attrs {}

class SomeModelWithChildren extends Model {
  properties: SomeModelWithChildren.Props

  constructor(attrs?: Partial<SomeModelWithChildren.Attrs>) {
    super(attrs)
  }

  static init_SomeModelWithChildren(): void {

    this.define<SomeModelWithChildren.Props>({
      children: [ p.Array, [] ],
    })
  }
}

Models.register('SomeModelWithChildren', SomeModelWithChildren)

namespace ModelWithConstructTimeChanges {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    foo: p.Property<number>
    child: p.Property<Model | null>
  }
}

interface ModelWithConstructTimeChanges extends ModelWithConstructTimeChanges.Attrs {}

class ModelWithConstructTimeChanges extends Model {
  properties: ModelWithConstructTimeChanges.Props

  constructor(attrs?: Partial<ModelWithConstructTimeChanges.Attrs>) {
    super(attrs)
  }

  initialize(): void {
    super.initialize()
    this.foo = 4
    this.child = new AnotherModel()
  }

  static init_ModelWithConstructTimeChanges(): void {

    this.define<ModelWithConstructTimeChanges.Props>({
      foo:   [ p.Number, 2 ],
      child: [ p.Instance, null ],
    })
  }
}

Models.register('ModelWithConstructTimeChanges', ModelWithConstructTimeChanges)

namespace ComplicatedModelWithConstructTimeChanges {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    list_prop: p.Property<AnotherModel[]>
    dict_prop: p.Property<{[key: string]: AnotherModel}>
    obj_prop: p.Property<ModelWithConstructTimeChanges>
    dict_of_list_prop: p.Property<{[key: string]: Model[]}>
  }
}

interface ComplicatedModelWithConstructTimeChanges extends ComplicatedModelWithConstructTimeChanges.Attrs {}

class ComplicatedModelWithConstructTimeChanges extends Model {
  properties: ComplicatedModelWithConstructTimeChanges.Props

  constructor(attrs?: Partial<ComplicatedModelWithConstructTimeChanges.Attrs>) {
    super(attrs)
  }

  initialize(): void {
    super.initialize()
    this.list_prop = [new AnotherModel()]
    this.dict_prop = { foo: new AnotherModel() }
    this.obj_prop = new ModelWithConstructTimeChanges()
    this.dict_of_list_prop = { foo: [new AnotherModel()] }
  }

  static init_ComplicatedModelWithConstructTimeChanges(): void {

    this.define<ComplicatedModelWithConstructTimeChanges.Props>({
      list_prop:         [ p.Array ],
      dict_prop:         [ p.Any ],
      obj_prop:          [ p.Instance ],
      dict_of_list_prop: [ p.Any ],
    })
  }
}

Models.register('ComplicatedModelWithConstructTimeChanges', ComplicatedModelWithConstructTimeChanges)

describe("Document", () => {

  let date_stub: sinon.SinonStub

  before_each(() => {
    date_stub = sinon.stub(Date, 'now')
    date_stub.onCall(0).returns(5)
    date_stub.onCall(1).returns(10)
    date_stub.onCall(2).returns(12)
    date_stub.onCall(3).returns(15)
    date_stub.onCall(4).returns(18)
  })

  after_each(() => {
    date_stub.restore()
  })

  it("should be constructable", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
  })

  it("has working add_root", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    d.add_root(new AnotherModel())
    expect(d.roots().length).to.be.equal(1)
  })

  it("manages noting interactivity periods", () => {
    const d = new Document()
    expect((d as any)._interactive_plot).to.be.null
    expect((d as any)._interactive_timestamp).to.be.null
    expect(d.interactive_duration()).to.be.equal(-1)

    const m1 = new SomeModel()
    const m2 = new AnotherModel()

    d.interactive_start(m1)  // first stub value 10
    expect((d as any)._interactive_plot.id).to.be.equal(m1.id)
    expect((d as any)._interactive_timestamp).to.be.equal(10)
    expect(d.interactive_duration()).to.be.equal(2) // second stub value 12

    d.interactive_start(m2)  // third stub value 15
    expect((d as any)._interactive_plot.id).to.be.equal(m1.id)
    expect((d as any)._interactive_timestamp).to.be.equal(15)
    expect(d.interactive_duration()).to.be.equal(3) // second stub value 18

    d.interactive_stop()
    expect((d as any)._interactive_plot).to.be.null
    expect((d as any)._interactive_timestamp).to.be.null
    expect(d.interactive_duration()).to.be.equal(-1)
  })

  it("has working set_title", () => {
    const d = new Document()
    expect(d.title()).to.be.equal("Bokeh Application")
    d.set_title("Foo")
    expect(d.title()).to.be.equal("Foo")
  })

  it("tracks all_models", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)
    const m = new SomeModel()
    const m2 = new AnotherModel()
    m.child = m2
    expect(m.child).to.be.equal(m2)
    d.add_root(m)
    expect(d.roots().length).to.be.equal(1)
    expect(d._all_models.size).to.be.equal(2)

    m.child = null
    expect(d._all_models.size).to.be.equal(1)
    m.child = m2
    expect(d._all_models.size).to.be.equal(2)
    d.remove_root(m)
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)
  })

  it("tracks all_models with list property", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)
    const m = new SomeModelWithChildren()
    const m2 = new AnotherModel()
    m.children = [m2]
    expect(m.children).to.be.equal([ m2 ])
    // check that we get the right all_models on initial add_root
    d.add_root(m)
    expect(d.roots().length).to.be.equal(1)
    expect(d._all_models.size).to.be.equal(2)

    // check that removing children list drops the models beneath it
    m.children = []
    expect(d._all_models.size).to.be.equal(1)

    // check that adding children back re-adds the models
    m.children = [m2]
    expect(d._all_models.size).to.be.equal(2)

    // check that removing root removes the models
    d.remove_root(m)
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)
  })

  it("tracks all_models with list property where list elements have a child", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)
    const m = new SomeModelWithChildren()
    const m3 = new AnotherModel()
    const m2 = new SomeModel({ child: m3 })
    m.children = [m2]
    expect(m.children).to.be.equal([ m2 ])

    // check that we get the right all_models on initial add_root
    d.add_root(m)
    expect(d.roots().length).to.be.equal(1)
    expect(d._all_models.size).to.be.equal(3)

    // check that removing children list drops the models beneath it
    m.children = []
    expect(d._all_models.size).to.be.equal(1)

    // check that adding children back re-adds the models
    m.children = [m2]
    expect(d._all_models.size).to.be.equal(3)

    // check that removing root removes the models
    d.remove_root(m)
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)
  })

  it("lets us get_model_by_id", () => {
    const d = new Document()
    const m = new SomeModel()
    const m2 = new AnotherModel()
    m.child = m2
    d.add_root(m)
    expect(d.get_model_by_id(m.id)).to.be.equal(m)
    expect(d.get_model_by_id(m2.id)).to.be.equal(m2)
    expect(d.get_model_by_id("invalidid")).to.be.null
  })

  it("lets us get_model_by_name", () => {
    const d = new Document()
    const m = new SomeModel({ name: "foo" })
    const m2 = new AnotherModel({ name: "bar" })
    m.child = m2
    d.add_root(m)
    expect(d.get_model_by_name(m.name!)).to.be.equal(m)
    expect(d.get_model_by_name(m2.name!)).to.be.equal(m2)
    expect(d.get_model_by_name("invalidid")).to.be.null
  })

  it("lets us get_model_by_name after changing name", () => {
    const d = new Document()
    const m = new SomeModel({ name: "foo" })
    d.add_root(m)
    expect(d.get_model_by_name("foo")).to.be.equal(m)
    expect(d.get_model_by_name("bar")).to.be.null
    m.name = "bar"
    expect(d.get_model_by_name("foo")).to.be.null
    expect(d.get_model_by_name("bar")).to.be.equal(m)
  })

  it("throws on get_model_by_name with duplicate name", () => {
    const d = new Document()
    const m = new SomeModel({ name: "foo" })
    const m2 = new AnotherModel({ name: "foo" })
    d.add_root(m)
    d.add_root(m2)
    expect(() => d.get_model_by_name('foo')).to.throw(Error, /Multiple models/)
  })

  it("can have all_models with multiple references", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)

    const root1 = new SomeModel()
    const root2 = new SomeModel()
    const child1 = new AnotherModel()
    root1.child = child1
    root2.child = child1
    d.add_root(root1)
    d.add_root(root2)
    expect(d.roots().length).to.be.equal(2)
    expect(d._all_models.size).to.be.equal(3)

    root1.child = null
    expect(d._all_models.size).to.be.equal(3)

    root2.child = null
    expect(d._all_models.size).to.be.equal(2)

    root1.child = child1
    expect(d._all_models.size).to.be.equal(3)

    root2.child = child1
    expect(d._all_models.size).to.be.equal(3)

    d.remove_root(root1)
    expect(d._all_models.size).to.be.equal(2)

    d.remove_root(root2)
    expect(d._all_models.size).to.be.equal(0)
  })

  it("can have all_models with cycles", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)

    const root1 = new SomeModel()
    const root2 = new SomeModel()
    const child1 = new SomeModel()
    root1.child = child1
    root2.child = child1
    child1.child = root1
    d.add_root(root1)
    d.add_root(root2)
    expect(d.roots().length).to.be.equal(2)
    expect(d._all_models.size).to.be.equal(3)

    root1.child = null
    expect(d._all_models.size).to.be.equal(3)

    root2.child = null
    expect(d._all_models.size).to.be.equal(2)

    root1.child = child1
    expect(d._all_models.size).to.be.equal(3)
  })

  it("can have all_models with cycles through lists", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)

    const root1 = new SomeModelWithChildren()
    const root2 = new SomeModelWithChildren()
    const child1 = new SomeModelWithChildren()
    root1.children = [child1]
    root2.children = [child1]
    child1.children = [root1]
    d.add_root(root1)
    d.add_root(root2)
    expect(d.roots().length).to.be.equal(2)
    expect(d._all_models.size).to.be.equal(3)

    root1.children = []
    expect(d._all_models.size).to.be.equal(3)

    root2.children = []
    expect(d._all_models.size).to.be.equal(2)

    root1.children = [child1]
    expect(d._all_models.size).to.be.equal(3)
  })

  it("can notify on ready", () => {
    const doc = new Document()

    let signals = 0
    doc.idle.connect(() => signals += 1)

    const events: ev.DocumentEvent[] = []
    doc.on_change((event) => events.push(event))

    const root = new SomeModelWithChildren()
    doc.add_root(root)
    doc.notify_idle(root)

    expect(signals).to.be.equal(1)
    expect(events.length).to.be.equal(2) // [RootAdded, MessageSent]

    const [, event] = events
    assert(event instanceof ev.MessageSentEvent)
    expect(event.msg_type).to.be.equal("bokeh_event")
    expect(event.msg_data).to.be.equal({event_name: "document_ready", event_values: {}})
  })

  it("can notify on changes", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)

    const m = new AnotherModel()

    d.add_root(m)
    expect(d.roots().length).to.be.equal(1)
    expect(m.bar).to.be.equal(1)

    const events: ev.DocumentEvent[] = []
    d.on_change((event) => events.push(event))

    m.bar = 42
    expect(events.length).to.be.equal(1)
    expect(events[0]).to.be.instanceof(ev.ModelChangedEvent)
    const event = events[0] as ev.ModelChangedEvent
    expect(event.document).to.be.equal(d)
    expect(event.model).to.be.equal(m)
    expect(event.attr).to.be.equal('bar')
    expect(event.old).to.be.equal(1)
    expect(event.new_).to.be.equal(42)
  })

  it("can notify on changes in batches", () => {
    const d = new Document()
    const m = new SomeModel()
    d.add_root(m)

    const events0: ev.DocumentEvent[] = []
    const events1: ev.DocumentChangedEvent[] = []

    d.on_change((event) => events0.push(event), true)
    d.on_change((event) => events1.push(event), false)

    m.setv({foo: 3, child: new SomeModel()})

    expect(events0.length).to.be.equal(1)
    expect(events1.length).to.be.equal(2)

    const [batch] = events0
    assert(batch instanceof ev.DocumentEventBatch)
    expect(batch.events.length).to.be.equal(2)
  })

  it("can remove notification changes", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)

    const m = new AnotherModel()

    d.add_root(m)
    expect(d.roots().length).to.be.equal(1)
    expect(m.bar).to.be.equal(1)

    const events: ev.DocumentChangedEvent[] = []
    const listener = (event: ev.DocumentChangedEvent) => events.push(event)
    d.on_change(listener)

    m.bar = 42

    expect(events.length).to.be.equal(1)
    expect(events[0]).to.be.instanceof(ev.ModelChangedEvent)
    const event0 = events[0] as ev.ModelChangedEvent
    expect(event0.new_).to.be.equal(42)

    d.remove_on_change(listener)
    m.bar = 43

    expect(events.length).to.be.equal(1)
  })

  it("should notify on roots change", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)

    const events: ev.DocumentEvent[] = []
    d.on_change((event) => events.push(event))

    const m = new AnotherModel({bar:1})
    d.add_root(m)
    expect(d.roots().length).to.be.equal(1)
    expect(events.length).to.be.equal(1)
    expect(events[0]).to.be.instanceof(ev.RootAddedEvent)
    const event0 = events[0] as ev.RootAddedEvent
    expect(event0.model).to.be.equal(m)

    const m2 = new AnotherModel({bar:2})
    d.add_root(m2)
    expect(d.roots().length).to.be.equal(2)
    expect(events.length).to.be.equal(2)
    expect(events[1]).to.be.instanceof(ev.RootAddedEvent)
    const event1 = events[1] as ev.RootAddedEvent
    expect(event1.model).to.be.equal(m2)

    d.remove_root(m)
    expect(d.roots().length).to.be.equal(1)
    expect(events.length).to.be.equal(3)
    expect(events[2]).to.be.instanceof(ev.RootRemovedEvent)
    const event2 = events[2] as ev.RootRemovedEvent
    expect(event2.model).to.be.equal(m)

    d.remove_root(m2)
    expect(d.roots().length).to.be.equal(0)
    expect(events.length).to.be.equal(4)
    expect(events[3]).to.be.instanceof(ev.RootRemovedEvent)
    const event3 = events[3] as ev.RootRemovedEvent
    expect(event3.model).to.be.equal(m2)
  })

  it("should notify on title change", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d.title()).to.be.equal(DEFAULT_TITLE)

    const events: ev.DocumentEvent[] = []
    d.on_change((event) => events.push(event))

    d.set_title('Foo')
    expect(d.title()).to.be.equal('Foo')
    expect(events.length).to.be.equal(1)
    expect(events[0]).to.be.instanceof(ev.TitleChangedEvent)
    const event = events[0] as ev.TitleChangedEvent
    expect(event.document).to.be.equal(d)
    expect(event.title).to.be.equal('Foo')
  })

  it("can clear", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d.title()).to.be.equal(DEFAULT_TITLE)
    d.add_root(new AnotherModel())
    d.add_root(new AnotherModel())
    d.set_title('Foo')
    expect(d.roots().length).to.be.equal(2)
    expect(d.title()).to.be.equal('Foo')
    d.clear()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)
    // does not reset title
    expect(d.title()).to.be.equal('Foo')
  })

  it("throws on destructive move of itself", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d.title()).to.be.equal(DEFAULT_TITLE)
    d.add_root(new AnotherModel())
    d.add_root(new AnotherModel())
    d.set_title('Foo')
    expect(d.roots().length).to.be.equal(2)
    expect(d.title()).to.be.equal('Foo')
    let got_error = false
    try {
      d.destructively_move(d)
    } catch (e) {
      got_error = true
      expect(e.message.includes("Attempted to overwrite a document with itself")).to.be.true
    }
    expect(got_error).to.be.true
  })

  it("can destructively move", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d.title()).to.be.equal(DEFAULT_TITLE)
    d.add_root(new AnotherModel())
    d.add_root(new AnotherModel())
    d.set_title('Foo')
    expect(d.roots().length).to.be.equal(2)
    expect(d.title()).to.be.equal('Foo')

    const d2 = new Document()
    expect(d2.roots().length).to.be.equal(0)
    expect(d2.title()).to.be.equal(DEFAULT_TITLE)
    d2.add_root(new SomeModel())
    d2.set_title('Bar')
    expect(d2.roots().length).to.be.equal(1)
    expect(d2.title()).to.be.equal('Bar')

    d2.destructively_move(d)
    expect(d.roots().length).to.be.equal(1)
    expect(d.roots()[0]).to.be.instanceof(SomeModel)
    const root0 = d.roots()[0] as SomeModel
    expect(root0.foo).to.be.equal(2)
    expect(d.title()).to.be.equal('Bar')

    expect(d2.roots().length).to.be.equal(0)
  })

  it("checks for versions matching", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    const root1 = new SomeModel()
    d.add_root(root1)
    expect(d.roots().length).to.be.equal(1)
    d.set_title("Foo")

    const original = logging.set_log_level("warn")
    try {
      const json = d.to_json_string()
      const parsed = JSON.parse(json)
      const py_version = js_version.replace(/-(dev|rc)\./, "$1")
      parsed.version = `${py_version}`
      const out0 = trap(() => Document.from_json_string(JSON.stringify(parsed)))
      expect(out0.warn).to.be.equal("")

      parsed.version = "0.0.1"
      const out1 = trap(() => Document.from_json_string(JSON.stringify(parsed)))
      expect(out1.warn).to.be.equal(`[bokeh] JS/Python version mismatch\n[bokeh] Library versions: JS (${js_version}) / Python (${parsed.version})\n`)

      parsed.version = `${py_version}rc123`
      const out2 = trap(() => Document.from_json_string(JSON.stringify(parsed)))
      expect(out2.warn).to.be.equal(`[bokeh] JS/Python version mismatch\n[bokeh] Library versions: JS (${js_version}) / Python (${parsed.version})\n`)

      parsed.version = `${py_version}dev123`
      const out3 = trap(() => Document.from_json_string(JSON.stringify(parsed)))
      expect(out3.warn).to.be.equal(`[bokeh] JS/Python version mismatch\n[bokeh] Library versions: JS (${js_version}) / Python (${parsed.version})\n`)

      parsed.version = `${py_version}-foo`
      const out4 = trap(() => Document.from_json_string(JSON.stringify(parsed)))
      expect(out4.warn).to.be.equal("")

      parsed.version = `${py_version}rc123-foo`
      const out5 = trap(() => Document.from_json_string(JSON.stringify(parsed)))
      expect(out5.warn).to.be.equal("")

      parsed.version = `${py_version}dev123-bar`
      const out6 = trap(() => Document.from_json_string(JSON.stringify(parsed)))
      expect(out6.warn).to.be.equal("")
    } finally {
      logging.set_log_level(original)
    }
  })

  it("can serialize with one model in it", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    const root1 = new SomeModel()
    d.add_root(root1)
    expect(d.roots().length).to.be.equal(1)
    d.set_title("Foo")

    const json = d.to_json_string()
    const parsed = JSON.parse(json)
    parsed.version = js_version
    const copy = Document.from_json_string(JSON.stringify(parsed))

    expect(copy.roots().length).to.be.equal(1)
    expect(copy.roots()[0]).to.be.instanceof(SomeModel)
    expect(copy.title()).to.be.equal("Foo")
  })

  it("can serialize excluding defaults", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    const root1 = new SomeModel()
    root1.name = 'bar'
    d.add_root(root1)
    expect(d.roots().length).to.be.equal(1)

    const json = d.to_json_string(false)
    const parsed = JSON.parse(json)
    parsed.version = js_version
    const copy = Document.from_json_string(JSON.stringify(parsed))

    expect(copy.roots().length).to.be.equal(1)
    expect(copy.roots()[0]).to.be.instanceof(SomeModel)
    expect(copy.roots()[0].name).to.be.equal('bar')

    // be sure defaults were NOT included
    const attrs0 = parsed.roots.references[0].attributes
    expect('tags' in attrs0).to.be.false
    expect('foo' in attrs0).to.be.false
    expect('child' in attrs0).to.be.false
    // this should be included, non-default
    expect('name' in attrs0).to.be.true

    // double-check different results if we do include_defaults
    const parsed_with_defaults = JSON.parse(d.to_json_string(true))
    const attrs1 = parsed_with_defaults.roots.references[0].attributes
    //expect('tags' in attrs1).to.be.true
    expect('foo' in attrs1).to.be.true
    expect('child' in attrs1).to.be.true
    expect('name' in attrs1).to.be.true
  })

  // TODO copy the following tests from test_document.py here
  // TODO(havocp) test_serialization_more_models

  it("can patch an integer property", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)

    const root1 = new SomeModel({ foo: 42 })
    const root2 = new SomeModel({ foo: 43 })
    const child1 = new SomeModel({ foo: 44 })
    root1.child = child1
    root2.child = child1
    d.add_root(root1)
    d.add_root(root2)
    expect(d.roots().length).to.be.equal(2)

    const event1 = new ev.ModelChangedEvent(d, root1, 'foo', root1.foo, 57)
    const patch1 = d.create_json_patch_string([event1])
    d.apply_json_patch(JSON.parse(patch1))

    expect(root1.foo).to.be.equal(57)

    const event2 = new ev.ModelChangedEvent(d, child1, 'foo', child1.foo, 67)
    const patch2 = d.create_json_patch_string([event2])
    d.apply_json_patch(JSON.parse(patch2))

    expect(child1.foo).to.be.equal(67)
  })

  it("can patch a reference property", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)

    const root1 = new SomeModel({ foo: 42 })
    const root2 = new SomeModel({ foo: 43 })
    const child1 = new SomeModel({ foo: 44 })
    const child2 = new SomeModel({ foo: 45 })
    const child3 = new SomeModel({ foo: 46, child: child2})
    root1.child = child1
    root2.child = child1
    d.add_root(root1)
    d.add_root(root2)
    expect(d.roots().length).to.be.equal(2)

    expect(d._all_models.has(child1.id)).to.be.true
    expect(d._all_models.has(child2.id)).to.be.false
    expect(d._all_models.has(child2.id)).to.be.false

    const event1 = new ev.ModelChangedEvent(d, root1, 'child', root1.child, child3)
    const patch1 = d.create_json_patch_string([event1])
    d.apply_json_patch(JSON.parse(patch1))

    expect(root1.child.id).to.be.equal(child3.id)
    expect(root1.child).to.be.instanceof(SomeModel)
    const root1_child0 = root1.child as SomeModel
    expect(root1_child0.child!.id).to.be.equal(child2.id)
    expect(d._all_models.has(child1.id)).to.be.true
    expect(d._all_models.has(child2.id)).to.be.true
    expect(d._all_models.has(child3.id)).to.be.true

    // put it back how it was before
    const event2 = new ev.ModelChangedEvent(d, root1, 'child', child1.child, child1)
    const patch2 = d.create_json_patch_string([event2])
    d.apply_json_patch(JSON.parse(patch2))

    expect(root1.child.id).to.be.equal(child1.id)
    expect(root1.child).to.be.instanceof(SomeModel)
    const root1_child1 = root1.child as SomeModel
    expect(root1_child1.child).to.be.null
    expect(d._all_models.has(child1.id)).to.be.true
    expect(d._all_models.has(child2.id)).to.be.false
    expect(d._all_models.has(child3.id)).to.be.false
  })

  it("can patch two properties at once", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)

    const root1 = new SomeModel({ foo: 42 })
    const child1 = new SomeModel({ foo: 43 })
    root1.child = child1
    d.add_root(root1)
    expect(d.roots().length).to.be.equal(1)

    const child2 = new SomeModel({ foo: 44 })

    const event1 = new ev.ModelChangedEvent(d, root1, 'foo', root1.foo, 57)
    const event2 = new ev.ModelChangedEvent(d, root1, 'child', root1.child, child2)
    const patch1 = d.create_json_patch_string([event1, event2])
    d.apply_json_patch(JSON.parse(patch1))

    expect(root1.foo).to.be.equal(57)
    expect(root1.child).to.be.instanceof(SomeModel)
    const root1_child0 = root1.child as SomeModel
    expect(root1_child0.foo).to.be.equal(44)
  })

  it("sets proper document on models added during patching", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)

    const root1 = new SomeModel({ foo: 42 })
    const child1 = new SomeModel({ foo: 44 })
    d.add_root(root1)
    expect(d.roots().length).to.be.equal(1)

    // can't create copy of doc here like other test. Testing explicitly that
    // doc attach happens when *not* creating a new document (i.e only patching)
    // Testing only for/against null .document is not the strongest test but it
    // should suffice.

    expect(root1.document!.roots().length).to.be.equal(1)
    expect(root1.child).to.be.null

    const event1 = new ev.ModelChangedEvent(d, root1, 'child', root1.child, child1)
    const patch1 = d.create_json_patch_string([event1])
    d.apply_json_patch(JSON.parse(patch1))

    expect(root1.document!.roots().length).to.be.equal(1)
    expect(root1.child!.document!.roots().length).to.be.equal(1)
  })

  it("sets proper document on models added during construction", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)

    const root1 = new ModelWithConstructTimeChanges()
    // change it so it doesn't match what initialize() does
    root1.foo = 3
    root1.child = null
    d.add_root(root1)

    const json = d.to_json_string()
    const parsed = JSON.parse(json)
    parsed.version = js_version
    const copy = Document.from_json_string(JSON.stringify(parsed))

    const root1_copy = copy.get_model_by_id(root1.id) as ModelWithConstructTimeChanges

    expect(root1.foo).to.be.equal(3)
    expect(root1.child).to.be.null

    // when unpacking the copy, initialize() was supposed to overwrite
    // what we unpacked.
    expect(root1_copy.foo).to.be.equal(4)
    expect(root1_copy.child).to.be.instanceof(AnotherModel)
    expect(root1_copy.document).to.be.equal(copy)
    expect(root1_copy.child!.document).to.be.equal(copy)
  })

  it("computes patch for models added during construction", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)

    const root1 = new ModelWithConstructTimeChanges()
    // change it so it doesn't match what initialize() does
    root1.foo = 3
    root1.child = null
    d.add_root(root1)

    const json = d.to_json_string()
    const parsed = JSON.parse(json)
    parsed.version = js_version
    const copy = Document.from_json_string(JSON.stringify(parsed))

    const patch = Document._compute_patch_since_json(JSON.parse(json), copy)

    expect(patch.events.length).to.be.equal(2)
    expect(root1.foo).to.be.equal(3)
    expect(root1.child).to.be.null
    d.apply_json_patch(patch)
    expect(root1.foo).to.be.equal(4)
    expect(root1.child).to.be.instanceof(AnotherModel)
  })

  it("computes complicated patch for models added during construction", () => {
    // this test simulates how from_json has to compute changes
    // to send back to the server, when the client side makes
    // changes while constructing the parsed document.
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)

    const root1 = new ComplicatedModelWithConstructTimeChanges()
    // change it so it doesn't match what initialize() does
    const serialized_values = {
      name: 'foo',
      tags: ['bar'],
      list_prop: [new AnotherModel({ bar: 42 })],
      dict_prop: { foo: new AnotherModel({ bar: 43 }) },
      obj_prop: new ModelWithConstructTimeChanges(),
      dict_of_list_prop: { foo: [new AnotherModel({ bar: 44 })] },
    }
    root1.setv(serialized_values)

    d.add_root(root1)

    // in computing this, we will construct a
    // ComplicatedModelWithConstructTimeChanges which will set
    // stuff in initialize(), overwriting serialized_values above.
    const json = d.to_json_string()
    const parsed = JSON.parse(json)
    parsed.version = js_version
    const copy = Document.from_json_string(JSON.stringify(parsed))

    const patch = Document._compute_patch_since_json(JSON.parse(json), copy)

    // document should have the values we set above
    for (const [key, value] of entries(serialized_values)) {
      expect(root1.property(key).get_value()).to.be.equal(value)
    }

    expect(root1.list_prop[0].bar).to.be.equal(42)
    expect(root1.dict_prop.foo.bar).to.be.equal(43)

    expect(patch.events.length).to.be.equal(4)

    // but when we apply the patch, initialize() should override
    // what we had in the json only for the four things that
    // ComplicatedModelWithConstructTimeChanges changes (not name
    // and tags)
    d.apply_json_patch(patch)
    expect(root1.name).to.be.equal('foo')
    expect(root1.tags).to.be.equal(['bar'])
    expect(root1.list_prop.length).to.be.equal(1)
    expect(root1.list_prop[0].bar).to.be.equal(1)
    expect(Object.keys(root1.dict_prop).length).to.be.equal(1)
    expect(root1.dict_prop.foo.bar).to.be.equal(1)
    expect(root1.obj_prop).to.be.instanceof(ModelWithConstructTimeChanges)
    expect(root1.obj_prop.child).to.be.instanceof(AnotherModel)
    expect(Object.keys(root1.dict_of_list_prop).length).to.be.equal(1)
    expect(values(root1.dict_of_list_prop)[0].length).to.be.equal(1)
  })
})
