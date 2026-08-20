import {expect} from "#framework/assertions"

import {HasProps} from "@bokehjs/core/has_props"
import {View} from "@bokehjs/core/view"
import type {ViewStorage} from "@bokehjs/core/build_views"
import {build_views} from "@bokehjs/core/build_views"

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

  it("should remove a view after it finishes building if a later call no longer wants it", async () => {
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

    // call0 is still building `model`'s view when call1 asks for an empty
    // set of models. call1 must not run its to_remove diff until call0 has
    // finished storing and connecting the view, otherwise the view would be
    // left stored and connected even though nothing wants it any more.
    const call0 = build_views(storage, [model], {parent: null})
    const call1 = build_views(storage, [], {parent: null})

    resolve_gate()

    const [result0, result1] = await Promise.all([call0, call1])

    expect(result0.created.length).to.be.equal(1)
    const view = result0.created[0]

    expect(result1.removed.length).to.be.equal(1)
    expect(result1.removed[0]).to.be.equal(view)
    expect(view.is_destroyed).to.be.true
    expect(storage.size).to.be.equal(0)
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
    // ok_model must never be attempted, so it can't end up stored without
    // ever having had connect_signals() called on it.
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
})
