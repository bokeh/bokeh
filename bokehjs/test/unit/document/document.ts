import {expect, expect_instanceof, expect_not_null} from "assertions"
import * as sinon from "sinon"

import type {Patch} from "@bokehjs/document"
import {Document, DEFAULT_TITLE} from "@bokehjs/document"
import * as ev from "@bokehjs/document/events"
import {version as js_version} from "@bokehjs/version"
import {register_models} from "@bokehjs/base"
import {Model} from "@bokehjs/model"
import * as logging from "@bokehjs/core/logging"
import type * as p from "@bokehjs/core/properties"
import {ColumnDataSource} from "@bokehjs/models"
import {DocumentReady} from "@bokehjs/core/bokeh_events"
import {Slice} from "@bokehjs/core/util/slice"
import {unique_id} from "@bokehjs/core/util/string"

import {trap} from "../../util"

namespace AnotherModel {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    bar: p.Property<number>
  }
}

interface AnotherModel extends AnotherModel.Attrs {}

class AnotherModel extends Model {
  declare properties: AnotherModel.Props

  constructor(attrs?: Partial<AnotherModel.Attrs>) {
    super(attrs)
  }

  static {
    this.define<AnotherModel.Props>(({Float}) => ({
      bar: [ Float, 1 ],
    }))
  }
}

register_models({AnotherModel})

namespace SomeModel {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    foo: p.Property<number>
    child: p.Property<Model | null>
    children: p.Property<SomeModel[]>
  }
}

interface SomeModel extends SomeModel.Attrs {}

class SomeModel extends Model {
  declare properties: SomeModel.Props

  constructor(attrs?: Partial<SomeModel.Attrs>) {
    super(attrs)
  }

  static {
    this.define<SomeModel.Props>(({Float, Ref, Nullable, List}) => ({
      foo:   [ Float, 2 ],
      child: [ Nullable(Ref(Model)), null ],
      children: [ List(Ref(SomeModel)), [] ],
    }))
  }
}

register_models({SomeModel})

namespace SomeModelWithChildren {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    children: p.Property<Model[]>
  }
}

interface SomeModelWithChildren extends SomeModelWithChildren.Attrs {}

class SomeModelWithChildren extends Model {
  declare properties: SomeModelWithChildren.Props

  constructor(attrs?: Partial<SomeModelWithChildren.Attrs>) {
    super(attrs)
  }

  static {
    this.define<SomeModelWithChildren.Props>(({List, Ref}) => ({
      children: [ List(Ref(Model)), [] ],
    }))
  }
}

register_models({SomeModelWithChildren})

namespace ModelWithConstructTimeChanges {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    foo: p.Property<number>
    child: p.Property<Model | null>
  }
}

interface ModelWithConstructTimeChanges extends ModelWithConstructTimeChanges.Attrs {}

class ModelWithConstructTimeChanges extends Model {
  declare properties: ModelWithConstructTimeChanges.Props

  constructor(attrs?: Partial<ModelWithConstructTimeChanges.Attrs>) {
    super(attrs)
  }

  override initialize(): void {
    super.initialize()
    this.foo = 4
    this.child = new AnotherModel()
  }

  static {
    this.define<ModelWithConstructTimeChanges.Props>(({Float, Ref, Nullable}) => ({
      foo:   [ Float, 2 ],
      child: [ Nullable(Ref(Model)), null ],
    }))
  }
}

register_models({ModelWithConstructTimeChanges})

describe("Document", () => {
  let date_stub: sinon.SinonStub

  before_each(() => {
    date_stub = sinon.stub(Date, "now")
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

  it("should be constructable with roots", () => {
    const child = new AnotherModel()
    const root = new SomeModel({child})
    const doc = new Document({roots: [root]})
    expect(doc.roots().length).to.be.equal(1)
    expect(doc._all_models.size).to.be.equal(2)
    expect(doc.all_models).to.be.equal(new Set([root, child]))
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
    const m2 = new SomeModel({child: m3})
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
    const m0 = new SomeModel({name: "foo"})
    const m1 = new AnotherModel({name: "bar"})
    m0.child = m1
    d.add_root(m0)
    expect_not_null(m0.name)
    expect_not_null(m1.name)
    expect(d.get_model_by_name(m0.name)).to.be.equal(m0)
    expect(d.get_model_by_name(m1.name)).to.be.equal(m1)
    expect(d.get_model_by_name("invalidid")).to.be.null
  })

  it("lets us get_model_by_name after changing name", () => {
    const d = new Document()
    const m = new SomeModel({name: "foo"})
    d.add_root(m)
    expect(d.get_model_by_name("foo")).to.be.equal(m)
    expect(d.get_model_by_name("bar")).to.be.null
    m.name = "bar"
    expect(d.get_model_by_name("foo")).to.be.null
    expect(d.get_model_by_name("bar")).to.be.equal(m)
  })

  it("throws on get_model_by_name with duplicate name", () => {
    const d = new Document()
    const m = new SomeModel({name: "foo"})
    const m2 = new AnotherModel({name: "foo"})
    d.add_root(m)
    d.add_root(m2)
    expect(() => d.get_model_by_name("foo")).to.throw(Error, /Multiple models/)
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
    expect(events).to.be.equal([
      new ev.RootAddedEvent(doc, root),
      new ev.MessageSentEvent(doc, "bokeh_event", new DocumentReady()),
    ])
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
    expect(event.attr).to.be.equal("bar")
    expect(event.value).to.be.equal(42)
  })

  it("notifies only on actual changes", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)

    const m = new AnotherModel()

    d.add_root(m)
    expect(d.roots().length).to.be.equal(1)

    const events: ev.DocumentEvent[] = []
    d.on_change((event) => events.push(event))

    expect(m.bar).to.be.equal(1)
    m.bar = 1
    expect(events.length).to.be.equal(0)
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
    expect_instanceof(batch, ev.DocumentEventBatch)
    expect(batch.events.length).to.be.equal(2)
  })

  it("can remove notification changes", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)

    const m = new AnotherModel()

    d.add_root(m)
    expect(d.roots().length).to.be.equal(1)
    expect(m.bar).to.be.equal(1)

    const events: ev.DocumentEvent[] = []
    const listener = (event: ev.DocumentEvent) => events.push(event)
    d.on_change(listener)

    m.bar = 42

    expect(events.length).to.be.equal(1)
    expect(events[0]).to.be.instanceof(ev.ModelChangedEvent)
    const event0 = events[0] as ev.ModelChangedEvent
    expect(event0.value).to.be.equal(42)

    d.remove_on_change(listener)
    m.bar = 43

    expect(events.length).to.be.equal(1)
  })

  it("should notify on roots change", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)

    const events: ev.DocumentEvent[] = []
    d.on_change((event) => events.push(event))

    const m = new AnotherModel({bar: 1})
    d.add_root(m)
    expect(d.roots().length).to.be.equal(1)
    expect(events.length).to.be.equal(1)
    expect(events[0]).to.be.instanceof(ev.RootAddedEvent)
    const event0 = events[0] as ev.RootAddedEvent
    expect(event0.model).to.be.equal(m)

    const m2 = new AnotherModel({bar: 2})
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

    d.set_title("Foo")
    expect(d.title()).to.be.equal("Foo")
    expect(events.length).to.be.equal(1)
    expect(events[0]).to.be.instanceof(ev.TitleChangedEvent)
    const event = events[0] as ev.TitleChangedEvent
    expect(event.document).to.be.equal(d)
    expect(event.title).to.be.equal("Foo")
  })

  it("can clear", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d.title()).to.be.equal(DEFAULT_TITLE)
    d.add_root(new AnotherModel())
    d.add_root(new AnotherModel())
    d.set_title("Foo")
    expect(d.roots().length).to.be.equal(2)
    expect(d.title()).to.be.equal("Foo")
    d.clear()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)
    // does not reset title
    expect(d.title()).to.be.equal("Foo")
  })

  it("throws on destructive move of itself", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d.title()).to.be.equal(DEFAULT_TITLE)
    d.add_root(new AnotherModel())
    d.add_root(new AnotherModel())
    d.set_title("Foo")
    expect(d.roots().length).to.be.equal(2)
    expect(d.title()).to.be.equal("Foo")
    expect(() => d.destructively_move(d)).to.throw(Error, "Attempted to overwrite a document with itself")
  })

  it("can destructively move", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d.title()).to.be.equal(DEFAULT_TITLE)
    d.add_root(new AnotherModel())
    d.add_root(new AnotherModel())
    d.set_title("Foo")
    expect(d.roots().length).to.be.equal(2)
    expect(d.title()).to.be.equal("Foo")

    const d2 = new Document()
    expect(d2.roots().length).to.be.equal(0)
    expect(d2.title()).to.be.equal(DEFAULT_TITLE)
    d2.add_root(new SomeModel())
    d2.set_title("Bar")
    expect(d2.roots().length).to.be.equal(1)
    expect(d2.title()).to.be.equal("Bar")

    d2.destructively_move(d)
    expect(d.roots().length).to.be.equal(1)
    expect(d.roots()[0]).to.be.instanceof(SomeModel)
    const root0 = d.roots()[0] as SomeModel
    expect(root0.foo).to.be.equal(2)
    expect(d.title()).to.be.equal("Bar")

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
      parsed.version = js_version.replace(/-dev\./, ".dev").replace(/-rc\./, "rc")
      const out0 = trap(() => Document.from_json_string(JSON.stringify(parsed)))
      expect(out0.warn).to.be.equal("")

      parsed.version = "0.0.1"
      const out1 = trap(() => Document.from_json_string(JSON.stringify(parsed)))
      expect(out1.warn).to.be.equal(`[bokeh ${js_version}] Bokeh/BokehJS version mismatch: new document using Bokeh ${parsed.version} and BokehJS ${js_version}\n`)

      const py_version = js_version.replace(/-.*/, "")
      parsed.version = `${py_version}rc123`
      const out2 = trap(() => Document.from_json_string(JSON.stringify(parsed)))
      expect(out2.warn).to.be.equal(`[bokeh ${js_version}] Bokeh/BokehJS version mismatch: new document using Bokeh ${parsed.version} and BokehJS ${js_version}\n`)

      parsed.version = `${py_version}.dev123`
      const out3 = trap(() => Document.from_json_string(JSON.stringify(parsed)))
      expect(out3.warn).to.be.equal(`[bokeh ${js_version}] Bokeh/BokehJS version mismatch: new document using Bokeh ${parsed.version} and BokehJS ${js_version}\n`)

      parsed.version = `${py_version}rc123+4.ffaa11dd`
      const out4 = trap(() => Document.from_json_string(JSON.stringify(parsed)))
      expect(out4.warn).to.be.equal(`[bokeh ${js_version}] Bokeh/BokehJS version mismatch: new document using Bokeh ${parsed.version} and BokehJS ${js_version}\n`)

      parsed.version = `${py_version}.dev123+4.ffaa11dd`
      const out5 = trap(() => Document.from_json_string(JSON.stringify(parsed)))
      expect(out5.warn).to.be.equal(`[bokeh ${js_version}] Bokeh/BokehJS version mismatch: new document using Bokeh ${parsed.version} and BokehJS ${js_version}\n`)
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
    root1.name = "foo"
    d.add_root(root1)
    expect(d.roots().length).to.be.equal(1)

    const json = d.to_json_string(false)
    const parsed = JSON.parse(json)
    parsed.version = js_version
    const copy = Document.from_json_string(JSON.stringify(parsed))

    expect(copy.roots().length).to.be.equal(1)
    const model0 = copy.roots()[0]
    expect(model0).to.be.instanceof(SomeModel)
    expect_instanceof(model0, SomeModel)
    expect(model0.name).to.be.equal("foo")

    // be sure defaults were NOT included
    const attrs0 = parsed.roots[0].attributes
    expect("tags" in attrs0).to.be.false
    expect("foo" in attrs0).to.be.false
    expect("child" in attrs0).to.be.false
    // this should be included, non-default
    expect("name" in attrs0).to.be.true

    // double-check different results if we do include_defaults
    const parsed_with_defaults = JSON.parse(d.to_json_string(true))
    const attrs1 = parsed_with_defaults.roots[0].attributes
    //expect('tags' in attrs1).to.be.true
    expect("foo" in attrs1).to.be.true
    expect("child" in attrs1).to.be.true
    expect("name" in attrs1).to.be.true
  })

  // TODO copy the following tests from test_document.py here
  // TODO(havocp) test_serialization_more_models

  it("can patch an integer property", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)

    const root1 = new SomeModel({foo: 42})
    const root2 = new SomeModel({foo: 43})
    const child1 = new SomeModel({foo: 44})
    root1.child = child1
    root2.child = child1
    d.add_root(root1)
    d.add_root(root2)
    expect(d.roots().length).to.be.equal(2)

    const event1 = new ev.ModelChangedEvent(d, root1, "foo", 57)
    const patch1 = d.create_json_patch([event1])
    d.apply_json_patch(patch1)

    expect(root1.foo).to.be.equal(57)

    const event2 = new ev.ModelChangedEvent(d, child1, "foo", 67)
    const patch2 = d.create_json_patch([event2])
    d.apply_json_patch(patch2)

    expect(child1.foo).to.be.equal(67)
  })

  it("can patch a reference property", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)

    const root1 = new SomeModel({foo: 42})
    const root2 = new SomeModel({foo: 43})
    const child1 = new SomeModel({foo: 44})
    const child2 = new SomeModel({foo: 45})
    const child3 = new SomeModel({foo: 46, child: child2})
    root1.child = child1
    root2.child = child1
    d.add_root(root1)
    d.add_root(root2)
    expect(d.roots().length).to.be.equal(2)

    expect(d._all_models.has(child1.id)).to.be.true
    expect(d._all_models.has(child2.id)).to.be.false
    expect(d._all_models.has(child2.id)).to.be.false

    const event1 = new ev.ModelChangedEvent(d, root1, "child", child3)
    const patch1 = d.create_json_patch([event1])
    d.apply_json_patch(patch1)

    expect(root1.child.id).to.be.equal(child3.id)
    expect_instanceof(root1.child, SomeModel)
    const root1_child0 = root1.child
    expect(root1_child0.child?.id).to.be.equal(child2.id)
    expect(d._all_models.has(child1.id)).to.be.true
    expect(d._all_models.has(child2.id)).to.be.true
    expect(d._all_models.has(child3.id)).to.be.true

    // put it back how it was before
    const event2 = new ev.ModelChangedEvent(d, root1, "child", child1)
    const patch2 = d.create_json_patch([event2])
    d.apply_json_patch(patch2)

    expect(root1.child.id).to.be.equal(child1.id)
    expect_instanceof(root1.child, SomeModel)
    const root1_child1 = root1.child
    expect(root1_child1.child).to.be.null
    expect(d._all_models.has(child1.id)).to.be.true
    expect(d._all_models.has(child2.id)).to.be.false
    expect(d._all_models.has(child3.id)).to.be.false
  })

  it("can patch two properties at once", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)

    const root1 = new SomeModel({foo: 42})
    const child1 = new SomeModel({foo: 43})
    root1.child = child1
    d.add_root(root1)
    expect(d.roots().length).to.be.equal(1)

    const child2 = new SomeModel({foo: 44})

    const event1 = new ev.ModelChangedEvent(d, root1, "foo", 57)
    const event2 = new ev.ModelChangedEvent(d, root1, "child", child2)
    const patch1 = d.create_json_patch([event1, event2])
    d.apply_json_patch(patch1)

    expect(root1.foo).to.be.equal(57)
    expect(root1.child).to.be.instanceof(SomeModel)
    const root1_child0 = root1.child as SomeModel
    expect(root1_child0.foo).to.be.equal(44)
  })

  it("sets proper document on models added during patching", () => {
    const d = new Document()
    expect(d.roots().length).to.be.equal(0)
    expect(d._all_models.size).to.be.equal(0)

    const root1 = new SomeModel({foo: 42})
    const child1 = new SomeModel({foo: 44})
    d.add_root(root1)
    expect(d.roots().length).to.be.equal(1)

    // can't create copy of doc here like other test. Testing explicitly that
    // doc attach happens when *not* creating a new document (i.e only patching)
    // Testing only for/against null .document is not the strongest test but it
    // should suffice.

    expect(root1.document?.roots().length).to.be.equal(1)
    expect(root1.child).to.be.null

    const event1 = new ev.ModelChangedEvent(d, root1, "child", child1)
    const patch1 = d.create_json_patch([event1])
    d.apply_json_patch(patch1)

    expect(root1.document?.roots().length).to.be.equal(1)
    expect(root1.child?.document?.roots().length).to.be.equal(1)
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
    expect(root1_copy.child?.document).to.be.equal(copy)
  })

  it("can detect changes during model initialization", () => {
    const doc_json = {
      version: js_version,
      title: "Bokeh Application",
      roots: [{
        type: "object" as const,
        name: "ModelWithConstructTimeChanges",
        id: "j0",
        attributes: {
          foo: 3,
        },
      }],
    }

    const events: ev.DocumentEvent[] = []
    const doc = Document.from_json(doc_json, events)

    expect(doc.roots().length).to.be.equal(1)
    expect(events.length).to.be.equal(2)

    const [root0] = doc.roots()
    expect_instanceof(root0, ModelWithConstructTimeChanges)
    expect(root0.foo).to.be.equal(4)
    expect(root0.child).to.be.instanceof(AnotherModel)
  })

  it("computes minimal patch for objects referencing known objects", () => {
    const events: ev.DocumentChangedEvent[] = []

    const doc = new Document()
    doc.on_change((event) => events.push(event))

    expect(doc.roots().length).to.be.equal(0)
    expect(doc._all_models.size).to.be.equal(0)

    const child = new SomeModel()
    const root = new SomeModel({child})
    doc.add_root(root)

    const patch0 = doc.create_json_patch(events)
    expect(patch0).to.be.equal({
      events: [{
        kind: "RootAdded",
        model: {
          type: "object",
          name: "SomeModel",
          id: root.id,
          attributes: {
            child: {
              type: "object",
              name: "SomeModel",
              id: child.id,
            },
          },
        },
      }],
    })

    const obj = new SomeModel({foo: 11})
    const event = new ev.MessageSentEvent(doc, "ping", {model: root, companion_model: obj})
    const patch1 = doc.create_json_patch([event])

    expect(patch1).to.be.equal({
      events: [{
        kind: "MessageSent",
        msg_type: "ping",
        msg_data: {
          type: "map",
          entries: [
            ["model", {id: root.id}],
            ["companion_model", {
              type: "object",
              name: "SomeModel",
              id: obj.id,
              attributes: {
                foo: 11,
              },
            }],
          ],
        },
      }],
    })
  })

  describe("doesn't boomerang events", () => {
    it("when adding a new root", () => {
      const doc = new Document()

      const events: ev.DocumentEvent[] = []
      doc.on_change((event) => events.push(event))

      const model0 = new SomeModel({foo: 127})
      const event = new ev.RootAddedEvent(doc, model0)
      const patch = doc.create_json_patch([event])
      doc.apply_json_patch(patch)

      expect(events.filter((e) => e.sync).length).to.be.equal(0)
      expect(events.filter((e) => !e.sync).length).to.be.equal(1)
      expect(doc.roots().length).to.be.equal(1)

      const model1 = new SomeModel({foo: 128})
      doc.add_root(model1)

      expect(events.filter((e) => e.sync).length).to.be.equal(1)
      expect(events.filter((e) => !e.sync).length).to.be.equal(1)
      expect(doc.roots().length).to.be.equal(2)
    })

    it("when removing a root", () => {
      const doc = new Document()

      const model0 = new SomeModel({foo: 127})
      const model1 = new SomeModel({foo: 128})
      doc.add_root(model0)
      doc.add_root(model1)
      expect(doc.roots().length).to.be.equal(2)

      const events: ev.DocumentEvent[] = []
      doc.on_change((event) => events.push(event))

      const event = new ev.RootRemovedEvent(doc, model0)
      const patch = doc.create_json_patch([event])
      doc.apply_json_patch(patch)

      expect(events.filter((e) => e.sync).length).to.be.equal(0)
      expect(events.filter((e) => !e.sync).length).to.be.equal(1)
      expect(doc.roots().length).to.be.equal(1)

      doc.remove_root(model1)

      expect(events.filter((e) => e.sync).length).to.be.equal(1)
      expect(events.filter((e) => !e.sync).length).to.be.equal(1)
      expect(doc.roots().length).to.be.equal(0)
    })

    it("when changing a title", () => {
      const doc = new Document()

      const events: ev.DocumentEvent[] = []
      doc.on_change((event) => events.push(event))

      expect(doc.title()).to.be.equal(DEFAULT_TITLE)

      const event = new ev.TitleChangedEvent(doc, "some title")
      const patch = doc.create_json_patch([event])
      doc.apply_json_patch(patch)

      expect(events.filter((e) => e.sync).length).to.be.equal(0)
      expect(events.filter((e) => !e.sync).length).to.be.equal(1)
      expect(doc.title()).to.be.equal("some title")

      doc.set_title("other title")

      expect(events.filter((e) => e.sync).length).to.be.equal(1)
      expect(events.filter((e) => !e.sync).length).to.be.equal(1)
      expect(doc.title()).to.be.equal("other title")
    })

    it("when modifying a model", () => {
      const doc = new Document()

      const model = new SomeModel({foo: 127})
      doc.add_root(model)

      const events: ev.DocumentEvent[] = []
      doc.on_change((event) => events.push(event))

      expect(doc.title()).to.be.equal(DEFAULT_TITLE)

      const event = new ev.ModelChangedEvent(doc, model, "foo", 128)
      const patch = doc.create_json_patch([event])
      doc.apply_json_patch(patch)

      expect(events.filter((e) => e.sync).length).to.be.equal(0)
      expect(events.filter((e) => !e.sync).length).to.be.equal(1)
      expect(model.foo).to.be.equal(128)

      model.foo = 129

      expect(events.filter((e) => e.sync).length).to.be.equal(1)
      expect(events.filter((e) => !e.sync).length).to.be.equal(1)
      expect(model.foo).to.be.equal(129)
    })

    it("when changing column data", () => {
      const doc = new Document()

      const source = new ColumnDataSource({data: {col0: [1, 2, 3]}})
      doc.add_root(source)

      const events: ev.DocumentEvent[] = []
      doc.on_change((event) => events.push(event))

      const event = new ev.ColumnDataChangedEvent(doc, source, "data", {col1: [4, 5, 6]})
      const patch = doc.create_json_patch([event])
      doc.apply_json_patch(patch)

      expect(events.filter((e) => e.sync).length).to.be.equal(0)
      expect(events.filter((e) => !e.sync).length).to.be.equal(1)
      expect(source.data).to.be.equal({col1: [4, 5, 6]})
    })

    it("when streaming to a column", () => {
      const doc = new Document()

      const source = new ColumnDataSource({data: {col0: [1, 2, 3]}})
      doc.add_root(source)

      const events: ev.DocumentEvent[] = []
      doc.on_change((event) => events.push(event))

      const event = new ev.ColumnsStreamedEvent(doc, source, "data", {col0: [4, 5, 6]})
      const patch = doc.create_json_patch([event])
      doc.apply_json_patch(patch)

      expect(events.filter((e) => e.sync).length).to.be.equal(0)
      expect(events.filter((e) => !e.sync).length).to.be.equal(1)
      expect(source.data).to.be.equal({col0: [1, 2, 3, 4, 5, 6]})

      source.stream({col0: [7, 8, 9]})

      expect(events.filter((e) => e.sync).length).to.be.equal(1)
      expect(events.filter((e) => !e.sync).length).to.be.equal(1)
      expect(source.data).to.be.equal({col0: [1, 2, 3, 4, 5, 6, 7, 8, 9]})
    })

    it("when patching a column", () => {
      const doc = new Document()

      const source = new ColumnDataSource({data: {col0: [1, 2, 3, 4, 5, 6]}})
      doc.add_root(source)

      const events: ev.DocumentEvent[] = []
      doc.on_change((event) => events.push(event))

      const event = new ev.ColumnsPatchedEvent(doc, source, "data", {col0: [[new Slice({start: 1, stop: 3}), [20, 30]]]})
      const patch = doc.create_json_patch([event])
      doc.apply_json_patch(patch)

      expect(events.filter((e) => e.sync).length).to.be.equal(0)
      expect(events.filter((e) => !e.sync).length).to.be.equal(1)
      expect(source.data).to.be.equal({col0: [1, 20, 30, 4, 5, 6]})

      source.patch({col0: [[new Slice({start: 3, stop: 5}), [40, 50]]]})

      expect(events.filter((e) => e.sync).length).to.be.equal(1)
      expect(events.filter((e) => !e.sync).length).to.be.equal(1)
      expect(source.data).to.be.equal({col0: [1, 20, 30, 40, 50, 6]})
    })
  })

  it("can patch already known references (issue #13611)", () => {
    const child5_id = unique_id()
    const child4 = new SomeModel({foo: 104})
    const child3 = new SomeModel({foo: 103})
    const child2 = new SomeModel({foo: 102, children: [child3, child4]})
    const child1 = new SomeModel({foo: 101})
    const root = new SomeModel({foo: 100, children: [child1, child2]})

    const updates = {
      root_foo: 0,
      root_children: 0,
      child1_foo: 0,
      child1_children: 0,
      child2_foo: 0,
      child2_children: 0,
      child3_foo: 0,
      child3_children: 0,
      child4_foo: 0,
      child4_children: 0,
    }

    root.on_change(root.properties.foo, () => updates.root_foo += 1)
    root.on_change(root.properties.children, () => updates.root_children += 1)
    child1.on_change(child1.properties.foo, () => updates.child1_foo += 1)
    child1.on_change(child1.properties.children, () => updates.child1_children += 1)
    child2.on_change(child2.properties.foo, () => updates.child2_foo += 1)
    child2.on_change(child2.properties.children, () => updates.child2_children += 1)
    child3.on_change(child3.properties.foo, () => updates.child3_foo += 1)
    child3.on_change(child3.properties.children, () => updates.child3_children += 1)
    child4.on_change(child4.properties.foo, () => updates.child4_foo += 1)
    child4.on_change(child4.properties.children, () => updates.child4_children += 1)

    const doc = new Document()
    doc.add_root(root)

    expect(doc.all_models).to.be.equal(new Set([root, child1, child2, child3, child4]))

    const patch1: Patch = {
      events: [
        {
          kind: "ModelChanged",
          model: root.ref(),
          attr: "foo",
          new: 200,
        },
        {
          kind: "ModelChanged",
          model: root.ref(),
          attr: "children",
          new: [
            child1.ref(),
            {
              type: "object",
              name: "SomeModel",
              id: child2.id,
              attributes: {
                foo: 202,
                children: [
                  {
                    type: "object",
                    name: "SomeModel",
                    id: child3.id,
                    attributes: {
                      foo: 203,
                      children: [
                        {
                          type: "object",
                          name: "SomeModel",
                          id: child5_id,
                          attributes: {
                            foo: 205,
                          },
                        },
                      ],
                    },
                  },
                  child4.ref(),
                ],
              },
            },
          ],
        },
      ],
    }
    doc.apply_json_patch(patch1)

    expect(root.foo).to.be.equal(200)
    expect(root.children).to.be.equal([child1, child2])

    expect(child1.foo).to.be.equal(101)
    expect(child1.children).to.be.equal([])

    expect(child2.foo).to.be.equal(202)
    expect(child2.children).to.be.equal([child3, child4])

    expect(child3.foo).to.be.equal(203)
    expect(child3.children.length).to.be.equal(1)
    const [child5] = child3.children

    expect(child4.foo).to.be.equal(104)
    expect(child4.children).to.be.equal([])

    expect(child5.id).to.be.equal(child5_id)
    expect(child5.foo).to.be.equal(205)
    expect(child5.children).to.be.equal([])

    expect(updates).to.be.equal({
      root_foo: 1,
      root_children: 0,   // same value
      child1_foo: 0,      // no change
      child1_children: 0, // no change
      child2_foo: 1,
      child2_children: 0, // same value
      child3_foo: 1,
      child3_children: 1,
      child4_foo: 0,      // no change
      child4_children: 0, // no change
    })
  })
})
