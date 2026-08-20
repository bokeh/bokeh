import {expect} from "#framework/assertions"

import {HasProps} from "@bokehjs/core/has_props"
import {View} from "@bokehjs/core/view"
import type {ViewStorage} from "@bokehjs/core/build_views"
import {build_views, remove_views} from "@bokehjs/core/build_views"

describe("core/build_views", () => {

  it("should not build duplicate views when build_views() is called concurrently for the same model", async () => {
    let n_built = 0

    let resolve_gate: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      resolve_gate = resolve
    })

    class SlowModelView extends View {
      declare model: SlowModel

      override initialize(): void {
        super.initialize()
        n_built++
      }

      override async lazy_initialize(): Promise<void> {
        await super.lazy_initialize()
        await gate
      }
    }

    class SlowModel extends HasProps {
      declare __view_type__: SlowModelView

      static {
        this.prototype.default_view = SlowModelView
      }
    }

    const model = new SlowModel()
    const storage: ViewStorage<HasProps> = new Map()

    // Simulates two on_change listeners on the same signal (e.g. Tabs.tabs
    // and Tabs.active both changing in the same patch) each independently
    // calling an async update_children(), without either call having had a
    // chance to register its view in `storage` yet.
    const call0 = build_views(storage, [model], {parent: null})
    const call1 = build_views(storage, [model], {parent: null})

    resolve_gate()

    const [result0, result1] = await Promise.all([call0, call1])

    expect(n_built).to.be.equal(1)
    expect(storage.size).to.be.equal(1)

    const created = [...result0.created, ...result1.created]
    expect(created.length).to.be.equal(1)
    expect(storage.get(model)).to.be.equal(created[0])
  })

  it("should not build a later model twice when it is only gated by an earlier one in the same batch", async () => {
    let n_built_a = 0
    let n_built_b = 0

    let resolve_gate: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      resolve_gate = resolve
    })

    class ModelAView extends View {
      declare model: ModelA

      override async lazy_initialize(): Promise<void> {
        await super.lazy_initialize()
        n_built_a++
        await gate
      }
    }

    class ModelA extends HasProps {
      declare __view_type__: ModelAView

      static {
        this.prototype.default_view = ModelAView
      }
    }

    class ModelBView extends View {
      declare model: ModelB

      override initialize(): void {
        super.initialize()
        n_built_b++
      }
    }

    class ModelB extends HasProps {
      declare __view_type__: ModelBView

      static {
        this.prototype.default_view = ModelBView
      }
    }

    const model_a = new ModelA()
    const model_b = new ModelB()
    const storage: ViewStorage<HasProps> = new Map()

    // call0 starts building model_a and is gated there, before it ever gets
    // to model_b. call1 is issued for the same batch while call0 is still
    // stuck on model_a.
    const call0 = build_views(storage, [model_a, model_b], {parent: null})
    const call1 = build_views(storage, [model_a, model_b], {parent: null})

    resolve_gate()

    const [result0, result1] = await Promise.all([call0, call1])

    expect(n_built_a).to.be.equal(1)
    expect(n_built_b).to.be.equal(1)
    expect(storage.size).to.be.equal(2)

    const created = [...result0.created, ...result1.created]
    expect(created.length).to.be.equal(2)
  })

  it("should stop building the rest of a batch immediately when an earlier model's build fails", async () => {
    let n_built_ok = 0

    class FailingModelView extends View {
      declare model: FailingModel

      override async lazy_initialize(): Promise<void> {
        await super.lazy_initialize()
        throw new Error("boom")
      }
    }

    class FailingModel extends HasProps {
      declare __view_type__: FailingModelView

      static {
        this.prototype.default_view = FailingModelView
      }
    }

    class OkModelView extends View {
      declare model: OkModel

      override initialize(): void {
        super.initialize()
        n_built_ok++
      }
    }

    class OkModel extends HasProps {
      declare __view_type__: OkModelView

      static {
        this.prototype.default_view = OkModelView
      }
    }

    const failing_model = new FailingModel()
    const ok_model = new OkModel()
    const storage: ViewStorage<HasProps> = new Map()

    let error: unknown
    try {
      await build_views(storage, [failing_model, ok_model], {parent: null})
    } catch (e) {
      error = e
    }

    expect(error).to.not.be.undefined
    expect(n_built_ok).to.be.equal(0)
    expect(storage.size).to.be.equal(0)

    // A later call on the same storage must not be permanently blocked by
    // the earlier failure.
    const result = await build_views(storage, [ok_model], {parent: null})
    expect(result.created.length).to.be.equal(1)
    expect(n_built_ok).to.be.equal(1)
  })

  it("should build separate views for the same model in unrelated view_storage maps", async () => {
    class SomeModelView extends View {
      declare model: SomeModel
    }

    class SomeModel extends HasProps {
      declare __view_type__: SomeModelView

      static {
        this.prototype.default_view = SomeModelView
      }
    }

    const model = new SomeModel()
    const storage0: ViewStorage<HasProps> = new Map()
    const storage1: ViewStorage<HasProps> = new Map()

    const [result0, result1] = await Promise.all([
      build_views(storage0, [model], {parent: null}),
      build_views(storage1, [model], {parent: null}),
    ])

    expect(result0.created.length).to.be.equal(1)
    expect(result1.created.length).to.be.equal(1)
    expect(result0.created[0]).to.not.be.equal(result1.created[0])
  })

  it("should not resolve until views requested by an overlapping call are stored", async () => {
    let resolve_gate: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      resolve_gate = resolve
    })

    class SlowModelView extends View {
      declare model: SlowModel

      override async lazy_initialize(): Promise<void> {
        await super.lazy_initialize()
        await gate
      }
    }

    class SlowModel extends HasProps {
      declare __view_type__: SlowModelView

      static {
        this.prototype.default_view = SlowModelView
      }
    }

    const model = new SlowModel()
    const storage: ViewStorage<HasProps> = new Map()

    // call1 doesn't build `model` itself (call0 already reserved it), but it
    // must still not resolve before the view exists, because callers use
    // `await build_views(...)` as "all requested views are available now".
    const call0 = build_views(storage, [model], {parent: null})
    const call1 = build_views(storage, [model], {parent: null})

    let call1_resolved = false
    void call1.then(() => {
      call1_resolved = true
    })

    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    expect(call1_resolved).to.be.false
    expect(storage.size).to.be.equal(0)

    resolve_gate()
    await Promise.all([call0, call1])

    expect(call1_resolved).to.be.true
    expect(storage.get(model)).to.not.be.undefined
  })

  it("should not connect a view that an overlapping call removed mid-batch", async () => {
    const connected: string[] = []

    let resolve_gate: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      resolve_gate = resolve
    })

    class FastModelView extends View {
      declare model: FastModel

      override connect_signals(): void {
        super.connect_signals()
        connected.push("fast")
      }
    }

    class FastModel extends HasProps {
      declare __view_type__: FastModelView

      static {
        this.prototype.default_view = FastModelView
      }
    }

    class SlowModelView extends View {
      declare model: SlowModel

      override connect_signals(): void {
        super.connect_signals()
        connected.push("slow")
      }

      override async lazy_initialize(): Promise<void> {
        await super.lazy_initialize()
        await gate
      }
    }

    class SlowModel extends HasProps {
      declare __view_type__: SlowModelView

      static {
        this.prototype.default_view = SlowModelView
      }
    }

    const fast_model = new FastModel()
    const slow_model = new SlowModel()
    const storage: ViewStorage<HasProps> = new Map()

    // call0 stores fast_model's view, then suspends on slow_model. call1 then
    // removes fast_model's view (it's already in storage, so call1's diff can
    // see it). Once call0 resumes it must not connect the view it stored, nor
    // report it as created, because that view is destroyed.
    const call0 = build_views(storage, [fast_model, slow_model], {parent: null})
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    expect(storage.has(fast_model)).to.be.true

    const call1 = build_views(storage, [slow_model], {parent: null})

    resolve_gate()
    const [result0, result1] = await Promise.all([call0, call1])

    expect(connected).to.be.equal(["slow"])
    expect(result0.created.length).to.be.equal(1)
    expect(result0.created[0].model).to.be.equal(slow_model)
    expect(result1.removed.length).to.be.equal(1)
    expect(result1.removed[0].model).to.be.equal(fast_model)
    expect([...storage.keys()]).to.be.equal([slow_model])
  })

  it("should tear down a view that is discarded before being stored", async () => {
    let connects = 0
    let disconnects = 0

    let resolve_gate: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      resolve_gate = resolve
    })

    class SlowModelView extends View {
      declare model: SlowModel

      override connect_signals(): void {
        super.connect_signals()
        connects++
      }

      override disconnect_signals(): void {
        disconnects++
        super.disconnect_signals()
      }

      override async lazy_initialize(): Promise<void> {
        await super.lazy_initialize()
        await gate
      }
    }

    class SlowModel extends HasProps {
      declare __view_type__: SlowModelView

      static {
        this.prototype.default_view = SlowModelView
      }
    }

    const model = new SlowModel()
    const storage: ViewStorage<HasProps> = new Map()

    // call0 is still building `model`'s view when call1 asks for an empty set of
    // models. call1 doesn't wait on call0, so it can't see `model` in its own
    // to_remove diff. call0 must notice, once its build finishes, that `model`
    // isn't wanted any more and tear the view down itself.
    const call0 = build_views(storage, [model], {parent: null})
    const call1 = build_views(storage, [], {parent: null})

    resolve_gate()
    const [result0, result1] = await Promise.all([call0, call1])

    // Connected exactly once before being removed, so that remove() is never
    // called on a view that was never connected.
    expect(connects).to.be.equal(1)
    expect(disconnects).to.be.equal(1)

    expect(result1.created.length).to.be.equal(0)
    expect(result1.removed.length).to.be.equal(0)

    expect(result0.created.length).to.be.equal(0)
    expect(result0.removed.length).to.be.equal(1)
    expect(result0.removed[0].is_destroyed).to.be.true
    expect(storage.size).to.be.equal(0)
  })

  it("should connect views stored before a later model in the same batch failed", async () => {
    let connects = 0

    class OkModelView extends View {
      declare model: OkModel

      override connect_signals(): void {
        super.connect_signals()
        connects++
      }
    }

    class OkModel extends HasProps {
      declare __view_type__: OkModelView

      static {
        this.prototype.default_view = OkModelView
      }
    }

    class FailingModelView extends View {
      declare model: FailingModel

      override async lazy_initialize(): Promise<void> {
        await super.lazy_initialize()
        throw new Error("boom")
      }
    }

    class FailingModel extends HasProps {
      declare __view_type__: FailingModelView

      static {
        this.prototype.default_view = FailingModelView
      }
    }

    const ok_model = new OkModel()
    const failing_model = new FailingModel()
    const storage: ViewStorage<HasProps> = new Map()

    let error: unknown
    try {
      await build_views(storage, [ok_model, failing_model], {parent: null})
    } catch (e) {
      error = e
    }

    expect(error).to.not.be.undefined
    // Anything left in storage must be connected, otherwise it's a live view
    // that never reacts to its model again.
    expect(storage.has(ok_model)).to.be.true
    expect(connects).to.be.equal(1)
  })

  it("should not build a model twice when it is requested twice in one call", async () => {
    let n_built = 0

    class SomeModelView extends View {
      declare model: SomeModel

      override initialize(): void {
        super.initialize()
        n_built++
      }
    }

    class SomeModel extends HasProps {
      declare __view_type__: SomeModelView

      static {
        this.prototype.default_view = SomeModelView
      }
    }

    const model = new SomeModel()
    const storage: ViewStorage<HasProps> = new Map()

    const result = await build_views(storage, [model, model], {parent: null})

    expect(n_built).to.be.equal(1)
    expect(result.created.length).to.be.equal(1)
    expect(storage.size).to.be.equal(1)
  })

  it("should discard an in-flight build when remove_views() empties the storage", async () => {
    let disconnects = 0

    let resolve_gate: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      resolve_gate = resolve
    })

    class SlowModelView extends View {
      declare model: SlowModel

      override disconnect_signals(): void {
        disconnects++
        super.disconnect_signals()
      }

      override async lazy_initialize(): Promise<void> {
        await super.lazy_initialize()
        await gate
      }
    }

    class SlowModel extends HasProps {
      declare __view_type__: SlowModelView

      static {
        this.prototype.default_view = SlowModelView
      }
    }

    const model = new SlowModel()
    const storage: ViewStorage<HasProps> = new Map()

    // The owner of `storage` is going away (e.g. DataTableView.remove()) while
    // a build is still in flight. That view must not end up stored in a storage
    // that nobody owns any more.
    const call = build_views(storage, [model], {parent: null})
    remove_views(storage)

    resolve_gate()
    const result = await call

    expect(disconnects).to.be.equal(1)
    expect(storage.size).to.be.equal(0)
    expect(result.created.length).to.be.equal(0)
    expect(result.removed.length).to.be.equal(1)
    expect(result.removed[0].is_destroyed).to.be.true
  })

  it("should propagate a failed build to calls waiting on it", async () => {
    class FailingModelView extends View {
      declare model: FailingModel

      override async lazy_initialize(): Promise<void> {
        await super.lazy_initialize()
        throw new Error("boom")
      }
    }

    class FailingModel extends HasProps {
      declare __view_type__: FailingModelView

      static {
        this.prototype.default_view = FailingModelView
      }
    }

    const model = new FailingModel()
    const storage: ViewStorage<HasProps> = new Map()

    const call0 = build_views(storage, [model], {parent: null})
    const call1 = build_views(storage, [model], {parent: null})

    const results = await Promise.allSettled([call0, call1])
    expect(results.map((result) => result.status)).to.be.equal(["rejected", "rejected"])
  })
})
