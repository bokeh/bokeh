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
