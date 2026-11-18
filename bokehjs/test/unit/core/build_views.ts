import sinon from "sinon"
import {expect, expect_not_null} from "#framework/assertions"
import {restorable} from "#framework/util"

import {HasProps} from "@bokehjs/core/has_props"
import {View} from "@bokehjs/core/view"
import {logger} from "@bokehjs/core/logging"
import type {ViewStorage} from "@bokehjs/core/build_views"
import {build_view, build_views, remove_views, ChildViewSlot} from "@bokehjs/core/build_views"

class SomeModelView extends View {
  declare model: SomeModel
}

class SomeModel extends HasProps {
  declare __view_type__: SomeModelView

  static {
    this.prototype.default_view = SomeModelView
  }
}

describe("core/build_views", () => {

  describe("build_view()", () => {
    it("should initialize and connect a view synchronously", () => {
      const view = build_view(SomeModel.create())
      expect(view).to.be.instanceof(SomeModelView)
      expect(view.is_destroyed).to.be.false
      view.remove()
    })

    it("should remove a view whose initialization fails", () => {
      const error = new Error("initialization failed")
      const views: FailingModelView[] = []

      class FailingModelView extends View {
        declare model: FailingModel

        override lazy_initialize(): void {
          super.lazy_initialize()
          views.push(this)
          throw error
        }
      }

      class FailingModel extends HasProps {
        declare __view_type__: FailingModelView

        static {
          this.prototype.default_view = FailingModelView
        }
      }

      expect(() => build_view(FailingModel.create())).to.throw(Error)
      expect(views.length).to.be.equal(1)
      expect(views[0].is_destroyed).to.be.true
    })

    it("should support asynchronous lazy_initialize() for compatibility, tracked by ready", async () => {
      let resume!: () => void
      const gate = new Promise<void>((resolve) => resume = resolve)
      let finished = false

      class AsyncModelView extends View {
        declare model: AsyncModel

        // oxlint-disable-next-line typescript/no-misused-promises -- deliberately asynchronous, which is deprecated
        override async lazy_initialize(): Promise<void> {
          super.lazy_initialize()
          await gate
          finished = true
        }
      }

      class AsyncModel extends HasProps {
        declare __view_type__: AsyncModelView

        static {
          this.prototype.default_view = AsyncModelView
        }
      }

      using warn = restorable(sinon.stub(logger, "warn"))
      const view = build_view(AsyncModel.create())
      expect(warn.callCount).to.be.equal(1)
      expect(finished).to.be.false

      let ready = false
      const settled = view.ready.then(() => ready = true)
      await Promise.resolve()
      expect(ready).to.be.false

      resume()
      await settled
      expect(finished).to.be.true
      view.remove()
    })
  })

  describe("build_views()", () => {
    it("should build, keep and remove views, appending views of new models", () => {
      const [m0, m1, m2] = [SomeModel.create(), SomeModel.create(), SomeModel.create()]
      const storage: ViewStorage<SomeModel> = new Map()

      const result0 = build_views(storage, [m0, m1])
      expect(result0.created.length).to.be.equal(2)
      expect(result0.removed.length).to.be.equal(0)
      const v0 = storage.get(m0)
      expect_not_null(v0)

      const result1 = build_views(storage, [m2, m0])
      expect(result1.created.length).to.be.equal(1)
      expect(result1.removed.length).to.be.equal(1)
      expect(result1.removed[0].is_destroyed).to.be.true
      expect([...storage.keys()]).to.be.equal([m0, m2])
      expect(storage.get(m0)).to.be.identical(v0)
    })

    it("should not build a model twice when it is requested twice in one call", () => {
      const model = SomeModel.create()
      const storage: ViewStorage<SomeModel> = new Map()
      const {created} = build_views(storage, [model, model])
      expect(created.length).to.be.equal(1)
      expect(storage.size).to.be.equal(1)
    })

    it("should build separate views for the same model in unrelated view_storage maps", () => {
      const model = SomeModel.create()
      const storage0: ViewStorage<SomeModel> = new Map()
      const storage1: ViewStorage<SomeModel> = new Map()
      build_views(storage0, [model])
      build_views(storage1, [model])
      expect(storage0.get(model)).to.not.be.identical(storage1.get(model))
    })

    describe("with a failing model", () => {
      const error = new Error("build failed")
      let failing = true

      class ModelView extends View {
        declare model: Model

        override connect_signals(): void {
          super.connect_signals()
          if (this.model.bad && failing) {
            throw error
          }
        }
      }

      class Model extends HasProps {
        declare __view_type__: ModelView
        bad: boolean = false

        static {
          this.prototype.default_view = ModelView
        }
      }

      function models(): [Model, Model, Model] {
        const bad = Model.create()
        bad.bad = true
        return [Model.create(), bad, Model.create()]
      }

      it("should stop building, but keep views built so far", () => {
        failing = true
        const [m0, bad, m2] = models()
        const storage: ViewStorage<Model> = new Map()
        expect(() => build_views(storage, [m0, bad, m2])).to.throw(Error)
        expect([...storage.keys()]).to.be.equal([m0])
        remove_views(storage)
      })

      it("should isolate failures handled by on_error and allow a later call to recover", () => {
        failing = true
        const [m0, bad, m2] = models()
        const storage: ViewStorage<Model> = new Map()
        const failures: [unknown, Model][] = []
        const on_error = (error: unknown, model: Model) => {
          failures.push([error, model])
        }
        const {created} = build_views(storage, [m0, bad, m2], {parent: null, on_error})
        expect(failures).to.be.equal([[error, bad]])
        expect(created.length).to.be.equal(2)
        expect([...storage.keys()]).to.be.equal([m0, m2])

        failing = false
        build_views(storage, [m0, bad, m2], {parent: null, on_error})
        expect([...storage.keys()]).to.be.equal([m0, m2, bad])
        remove_views(storage)
      })

      it("should propagate an error thrown by on_error", () => {
        failing = true
        const [m0, bad, m2] = models()
        const storage: ViewStorage<Model> = new Map()
        const on_error = () => {
          throw new Error("handler failed")
        }
        expect(() => build_views(storage, [m0, bad, m2], {parent: null, on_error})).to.throw(Error)
        expect([...storage.keys()]).to.be.equal([m0])
        remove_views(storage)
      })
    })

    it("should reject building views reentrantly into the same storage", () => {
      const storage: ViewStorage<HasProps> = new Map()
      const inner = SomeModel.create()

      class ReentrantModelView extends View {
        declare model: ReentrantModel

        override lazy_initialize(): void {
          super.lazy_initialize()
          build_views(storage, [this.model, inner])
        }
      }

      class ReentrantModel extends HasProps {
        declare __view_type__: ReentrantModelView

        static {
          this.prototype.default_view = ReentrantModelView
        }
      }

      expect(() => build_views(storage, [ReentrantModel.create()])).to.throw(Error)
      expect(storage.size).to.be.equal(0)
      // the storage is usable again afterwards
      build_views(storage, [inner])
      expect(storage.size).to.be.equal(1)
      remove_views(storage)
    })
  })

  describe("remove_views()", () => {
    it("should remove all views", () => {
      const storage: ViewStorage<SomeModel> = new Map()
      build_views(storage, [SomeModel.create(), SomeModel.create()])
      const views = [...storage.values()]
      remove_views(storage)
      expect(storage.size).to.be.equal(0)
      expect(views.every((view) => view.is_destroyed)).to.be.true
    })
  })

  describe("ChildViewSlot", () => {
    function setup() {
      const parent = build_view(SomeModel.create())
      const slot = new ChildViewSlot<SomeModel>(parent)
      return {parent, slot}
    }

    it("should build a view and replace it with a newer one", () => {
      const {parent, slot} = setup()
      const [model0, model1] = [SomeModel.create(), SomeModel.create()]

      expect(slot.build(model0)).to.be.true
      const view0 = slot.view
      expect(view0?.model).to.be.equal(model0)

      expect(slot.build(model1)).to.be.true
      expect(slot.view?.model).to.be.equal(model1)
      expect(view0?.is_destroyed).to.be.true

      expect(slot.build(null)).to.be.true
      expect(slot.view).to.be.null
      parent.remove()
    })

    it("should keep the previous view if building fails", () => {
      const {parent, slot} = setup()

      class FailingModelView extends View {
        declare model: FailingModel

        override initialize(): void {
          super.initialize()
          throw new Error("build failed")
        }
      }

      class FailingModel extends HasProps {
        declare __view_type__: FailingModelView

        static {
          this.prototype.default_view = FailingModelView
        }
      }

      const model0 = SomeModel.create()
      slot.build(model0)
      const view0 = slot.view
      expect(() => slot.build(FailingModel.create())).to.throw(Error)
      expect(slot.view).to.be.identical(view0)
      expect(view0?.is_destroyed).to.be.false
      parent.remove()
    })

    it("should let a clear triggered by removal of the outgoing view supersede the build", () => {
      const {parent, slot} = setup()
      const [model0, model1] = [SomeModel.create(), SomeModel.create()]

      slot.build(model0)
      const view0 = slot.view
      expect_not_null(view0)

      const reentrant: boolean[] = []
      view0.removed.connect(() => {
        reentrant.push(slot.build(null))
      })

      expect(slot.build(model1)).to.be.false
      expect(reentrant).to.be.equal([true])
      expect(slot.view).to.be.null
      expect(view0.is_destroyed).to.be.true
      parent.remove()
    })

    it("should let a build triggered by removal of the outgoing view supersede the build", () => {
      const {parent, slot} = setup()
      const [model0, model1, model2] = [SomeModel.create(), SomeModel.create(), SomeModel.create()]

      slot.build(model0)
      const view0 = slot.view
      expect_not_null(view0)

      let view1: View | null = null
      const reentrant: boolean[] = []
      view0.removed.connect(() => {
        view1 = slot.view
        reentrant.push(slot.build(model2))
      })

      expect(slot.build(model1)).to.be.false
      expect(reentrant).to.be.equal([true])
      expect(slot.view?.model).to.be.equal(model2)
      expect(view1).to.not.be.null
      expect(view1!.is_destroyed).to.be.true
      parent.remove()
    })

    it("should remove the current view on remove()", () => {
      const {parent, slot} = setup()
      slot.build(SomeModel.create())
      const view = slot.view
      slot.remove()
      expect(slot.view).to.be.null
      expect(view?.is_destroyed).to.be.true
      parent.remove()
    })
  })
})
