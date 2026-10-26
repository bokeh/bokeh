import * as sinon from "sinon"
import {expect, expect_not_null} from "#framework/assertions"

import {HasProps} from "@bokehjs/core/has_props"
import {View} from "@bokehjs/core/view"
import type {ChildView, ViewStorage} from "@bokehjs/core/build_views"
import {build_view, build_views} from "@bokehjs/core/build_views"
import type * as p from "@bokehjs/core/properties"
import {Ref, List} from "@bokehjs/core/kinds"
import {defer} from "@bokehjs/core/util/defer"
import {logger} from "@bokehjs/core/logging"

class SomeModelView extends View {
  declare model: SomeModel

  protected _children_views_map: ViewStorage<HasProps> = new Map()

  override _children_views(): ChildView[] {
    return [...super._children_views(), ...this._children_views_map.values()]
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await build_views(this._children_views_map, this.model.children, {parent: this})
  }
}

export namespace SomeModel {
  export type Attrs = p.AttrsOf<Props>
  export type Props = HasProps.Props & {
    children: p.Property<HasProps[]>
  }
}

export interface SomeModel extends SomeModel.Attrs {}

export class SomeModel extends HasProps {
  declare properties: SomeModel.Props
  declare __view_type__: SomeModelView

  constructor(attrs?: Partial<SomeModel.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SomeModelView

    this.define<SomeModel.Props>({
      children: [ List(Ref(HasProps)), [] ],
    })
  }
}

class ListeningModelView extends View {
  declare model: ListeningModel

  received: number = 0

  override connect_signals(): void {
    super.connect_signals()
    document.addEventListener("some_event", () => this.received++, {signal: this.abort_signal})
  }
}

export class ListeningModel extends HasProps {
  declare __view_type__: ListeningModelView

  static {
    this.prototype.default_view = ListeningModelView
  }
}

let failed_view: View | null = null
const get_failed_view = (): View | null => failed_view

class InitializeFailureView extends SomeModelView {
  override initialize(): void {
    failed_view = this
    throw new Error("initialization failed")
  }
}

class InitializeFailureModel extends SomeModel {
  static {
    this.prototype.default_view = InitializeFailureView
  }
}

class LazyFailureView extends SomeModelView {
  override initialize(): void {
    super.initialize()
    failed_view = this
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    throw new Error("lazy initialization failed")
  }
}

class LazyFailureModel extends SomeModel {
  static {
    this.prototype.default_view = LazyFailureView
  }
}

class SignalFailureView extends SomeModelView {
  override initialize(): void {
    super.initialize()
    failed_view = this
  }

  override connect_signals(): void {
    super.connect_signals()
    throw new Error("signal connection failed")
  }
}

class SignalFailureModel extends SomeModel {
  static {
    this.prototype.default_view = SignalFailureView
  }
}

describe("core/view", () => {

  describe("View", () => {
    for (const [model, message] of [
      [InitializeFailureModel.create(), "initialization failed"],
      [LazyFailureModel.create(), "lazy initialization failed"],
      [SignalFailureModel.create(), "signal connection failed"],
    ] as const) {
      it(`should remove a view when ${message}`, async () => {
        failed_view = null
        let thrown: unknown = null
        try {
          await build_view(model)
        } catch (error) {
          thrown = error
        }

        expect(thrown).to.be.instanceof(Error)
        expect((thrown as Error).message).to.be.equal(message)
        const view = get_failed_view()
        expect_not_null(view)
        expect(view.is_destroyed).to.be.true
      })
    }

    it("should disconnect a previously connected slot", async () => {
      const model = SomeModel.create()
      const view = await build_view(model)

      let calls = 0
      const slot = () => calls++

      expect(view.connect(model.change, slot)).to.be.true
      model.change.emit()
      expect(calls).to.be.equal(1)

      expect(view.disconnect(model.change, slot)).to.be.true
      model.change.emit()
      expect(calls).to.be.equal(1)

      expect(view.connect(model.change, slot)).to.be.true
      model.change.emit()
      expect(calls).to.be.equal(2)
    })

    it("should not disconnect signals of a view that was never connected", async () => {
      let disconnects = 0

      class UnconnectedModelView extends View {
        declare model: UnconnectedModel

        override disconnect_signals(): void {
          disconnects++
          super.disconnect_signals()
        }
      }

      class UnconnectedModel extends HasProps {
        declare __view_type__: UnconnectedModelView

        static {
          this.prototype.default_view = UnconnectedModelView
        }
      }

      // build_view() connects, so build the view the way build_views() does when
      // it has to throw away a build nothing wants any more.
      const view = new UnconnectedModelView({model: UnconnectedModel.create(), parent: null})
      view.initialize()
      await view.lazy_initialize()

      view.remove()

      // disconnect_signals() overrides are entitled to assume connect_signals()
      // already ran (e.g. only creating an observer there).
      expect(disconnects).to.be.equal(0)
      expect(view.is_destroyed).to.be.true
    })

    it("should stop listening to DOM events on shared targets after being removed", async () => {
      const view = await build_view(ListeningModel.create())

      try {
        document.dispatchEvent(new Event("some_event"))
        expect(view.received).to.be.equal(1)
      } finally {
        view.remove()
      }

      document.dispatchEvent(new Event("some_event"))
      expect(view.received).to.be.equal(1)
    })

    it("should disconnect changes from former transitive references", async () => {
      const child0 = SomeModel.create()
      const child1 = SomeModel.create({children: [SomeModel.create()]})
      const model = SomeModel.create({children: [child0]})
      const view = await build_view(model)

      let calls = 0
      view.on_transitive_change(model.properties.children, () => calls++)

      child0.change.emit()
      expect(calls).to.be.equal(1)

      model.children = [child1]
      calls = 0

      child0.change.emit()
      expect(calls).to.be.equal(0)
      child1.change.emit()
      expect(calls).to.be.equal(1)

      model.children = [child0]
      calls = 0

      child1.change.emit()
      expect(calls).to.be.equal(0)
      child0.change.emit()
      expect(calls).to.be.equal(1)
    })

    it("should not accumulate slots for retained transitive references", async () => {
      const child0 = SomeModel.create()
      const child1 = SomeModel.create()
      const model = SomeModel.create({children: [child0]})
      const view = await build_view(model)

      let calls = 0
      view.on_transitive_change(model.properties.children, () => calls++)

      model.children = [child0, child1]
      calls = 0

      child0.change.emit()
      expect(calls).to.be.equal(1)
      child1.change.emit()
      expect(calls).to.be.equal(2)
    })

    it("should disconnect changes from former recursive transitive references", async () => {
      const leaf0 = SomeModel.create()
      const branch0 = SomeModel.create({children: [leaf0]})
      const leaf1 = SomeModel.create()
      const branch1 = SomeModel.create({children: [leaf1, SomeModel.create()]})
      const model = SomeModel.create({children: [branch0]})
      const view = await build_view(model)

      let calls = 0
      view.on_transitive_change(model.properties.children, () => calls++, {recursive: true})

      leaf0.change.emit()
      expect(calls).to.be.equal(1)

      model.children = [branch1]
      calls = 0

      branch0.change.emit()
      leaf0.change.emit()
      expect(calls).to.be.equal(0)
      leaf1.change.emit()
      expect(calls).to.be.equal(1)
    })

    describe("should support schedule() and ready", () => {
      it("which waits for a scheduled task", async () => {
        const view = await build_view(SomeModel.create())
        let done = false
        view.schedule(async () => {
          await defer()
          done = true
        })
        await view.ready
        expect(done).to.be.true
      })

      it("which runs a task immediately", async () => {
        const view = await build_view(SomeModel.create())
        let started = false
        view.schedule(async () => {
          started = true
        })
        expect(started).to.be.true
        await view.ready
      })

      it("which waits for tasks scheduled while waiting", async () => {
        const view = await build_view(SomeModel.create())
        let done = false
        view.schedule(async () => {
          await defer()
          view.schedule(async () => {
            await defer()
            done = true
          })
        })
        await view.ready
        expect(done).to.be.true
      })

      it("which lets a root wait for tasks of its descendants", async () => {
        const child = SomeModel.create()
        const root = SomeModel.create({children: [child]})
        const root_view = await build_view(root)
        const child_view = root_view.views.find_one(child)
        expect_not_null(child_view)
        let done = false
        child_view.schedule(async () => {
          await defer()
          child_view.schedule(async () => {
            await defer()
            done = true
          })
        })
        await root_view.ready
        expect(done).to.be.true
      })

      it("which rejects when a task throws synchronously", async () => {
        const view = await build_view(SomeModel.create())
        view.schedule(() => {
          throw new Error("task failed")
        })
        let thrown: unknown = null
        try {
          await view.ready
        } catch (error) {
          thrown = error
        }
        expect(thrown).to.be.instanceof(Error)
        expect((thrown as Error).message).to.be.equal("task failed")
      })

      async function rejection(promise: Promise<void>): Promise<unknown> {
        try {
          await promise
          return null
        } catch (error) {
          return error
        }
      }

      function deferred(): {promise: Promise<void>, resolve: () => void, reject: (error: unknown) => void} {
        let resolve!: () => void
        let reject!: (error: unknown) => void
        const promise = new Promise<void>((res, rej) => {
          resolve = res
          reject = rej
        })
        return {promise, resolve, reject}
      }

      async function build_tree() {
        const leaf = SomeModel.create()
        const sibling = SomeModel.create()
        const mid = SomeModel.create({children: [leaf, sibling]})
        const root = SomeModel.create({children: [mid]})
        const root_view = await build_view(root)
        const mid_view = root_view.views.find_one(mid)
        const leaf_view = root_view.views.find_one(leaf)
        const sibling_view = root_view.views.find_one(sibling)
        expect_not_null(mid_view)
        expect_not_null(leaf_view)
        expect_not_null(sibling_view)
        return {root_view, mid_view, leaf_view, sibling_view}
      }

      it("which lets a non-root view wait for tasks of its descendants", async () => {
        const {mid_view, leaf_view} = await build_tree()
        let done = false
        leaf_view.schedule(async () => {
          await defer()
          leaf_view.schedule(async () => {
            await defer()
            done = true
          })
        })
        await mid_view.ready
        expect(done).to.be.true
      })

      it("which doesn't wait for tasks of siblings or ancestors", async () => {
        const {root_view, mid_view, leaf_view, sibling_view} = await build_tree()
        const pending = deferred()
        sibling_view.schedule(() => pending.promise)
        root_view.schedule(() => pending.promise)
        await leaf_view.ready
        let mid_ready = false
        void mid_view.ready.then(() => mid_ready = true)
        await defer()
        expect(mid_ready).to.be.false
        pending.resolve()
        await root_view.ready
        expect(mid_ready).to.be.true
      })

      it("which reports a failure to the owner and all its ancestors", async () => {
        const {root_view, mid_view, leaf_view} = await build_tree()
        leaf_view.schedule(async () => {
          throw new Error("leaf failed")
        })
        const views = [leaf_view, mid_view, root_view]
        const errors = await Promise.all(views.map((view) => rejection(view.ready)))
        for (const error of errors) {
          expect(error).to.be.instanceof(Error)
          expect((error as Error).message).to.be.equal("leaf failed")
        }
      })

      it("which doesn't keep failures that happen while nobody waits", async () => {
        const {root_view, leaf_view} = await build_tree()
        const pending = deferred()
        leaf_view.schedule(() => pending.promise)
        pending.reject(new Error("leaf failed"))
        await defer()
        expect(await rejection(leaf_view.ready)).to.be.null
        expect(await rejection(root_view.ready)).to.be.null
      })

      it("which reports a failure only to views waiting for it", async () => {
        const {root_view, leaf_view} = await build_tree()
        const pending = deferred()
        leaf_view.schedule(() => pending.promise)
        const root_error = rejection(root_view.ready)
        pending.reject(new Error("leaf failed"))
        expect(await root_error).to.be.instanceof(Error)
        expect(await rejection(leaf_view.ready)).to.be.null
      })

      it("which clears failures once reported", async () => {
        const view = await build_view(SomeModel.create())
        view.schedule(async () => {
          throw new Error("task failed")
        })
        expect(await rejection(view.ready)).to.be.instanceof(Error)
        expect(await rejection(view.ready)).to.be.null
        let done = false
        view.schedule(async () => {
          await defer()
          done = true
        })
        expect(await rejection(view.ready)).to.be.null
        expect(done).to.be.true
      })

      it("which rejects all concurrent waiters with the same failure", async () => {
        const view = await build_view(SomeModel.create())
        view.schedule(async () => {
          await defer()
          throw new Error("task failed")
        })
        const [error0, error1] = await Promise.all([rejection(view.ready), rejection(view.ready)])
        expect(error0).to.be.instanceof(Error)
        expect(error1).to.be.identical(error0)
      })

      it("which aggregates multiple failures", async () => {
        const view = await build_view(SomeModel.create())
        view.schedule(async () => {
          throw new Error("task 0 failed")
        })
        view.schedule(async () => {
          throw new Error("task 1 failed")
        })
        const error = await rejection(view.ready)
        expect(error).to.be.instanceof(AggregateError)
        const messages = (error as AggregateError).errors.map((error: Error) => error.message)
        expect(messages).to.be.equal(["task 0 failed", "task 1 failed"])
      })

      it("which stops waiting for tasks of removed views", async () => {
        const {root_view, mid_view, leaf_view} = await build_tree()
        leaf_view.schedule(() => new Promise(() => {}))
        let root_ready = false
        let leaf_ready = false
        void root_view.ready.then(() => root_ready = true)
        void leaf_view.ready.then(() => leaf_ready = true)
        await defer()
        expect(root_ready).to.be.false
        expect(leaf_ready).to.be.false
        mid_view.remove()
        await defer()
        expect(root_ready).to.be.true
        expect(leaf_ready).to.be.true
      })

      it("which ignores failures of tasks of removed views", async () => {
        const {root_view, leaf_view} = await build_tree()
        const pending = deferred()
        leaf_view.schedule(() => pending.promise)
        leaf_view.remove()
        pending.reject(new Error("task failed"))
        expect(await rejection(root_view.ready)).to.be.null
        expect(await rejection(leaf_view.ready)).to.be.null
      })

      it("which aborts the task's signal when the view is removed", async () => {
        const view = await build_view(SomeModel.create())
        const signals: AbortSignal[] = []
        view.schedule(async (signal) => {
          signals.push(signal)
          await new Promise(() => {})
        })
        expect(signals.length).to.be.equal(1)
        const [signal] = signals
        expect(signal.aborted).to.be.false
        view.remove()
        expect(signal.aborted).to.be.true
        await view.ready
      })

      it("which doesn't run tasks of removed views", async () => {
        const view = await build_view(SomeModel.create())
        view.remove()
        let started = false
        view.schedule(async () => {
          started = true
        })
        expect(started).to.be.false
        await view.ready
      })

      async function warnings(fn: () => Promise<void>): Promise<string[]> {
        const spy = sinon.spy(logger, "warn")
        try {
          await fn()
          return spy.args.map(([message]) => String(message))
        } finally {
          spy.restore()
        }
      }

      const deadlock = /a task waits for 'ready' that it counts towards/

      it("which warns when a task waits for ready of its view", async () => {
        const view = await build_view(SomeModel.create())
        const messages = await warnings(async () => {
          view.schedule(async () => {
            await view.ready
          })
          // the task would never finish otherwise
          view.remove()
          await view.ready
        })
        expect(messages.length).to.be.equal(1)
        expect(deadlock.test(messages[0])).to.be.true
      })

      it("which warns when a signal handler waits for ready of an ancestor", async () => {
        const {root_view, leaf_view} = await build_tree()
        const messages = await warnings(async () => {
          leaf_view.on_change(leaf_view.model.properties.children, async () => {
            await root_view.ready
          })
          leaf_view.model.children = [SomeModel.create()]
          leaf_view.remove()
          await root_view.ready
        })
        expect(messages.length).to.be.equal(1)
        expect(deadlock.test(messages[0])).to.be.true
      })

      it("which doesn't warn when a task waits for ready of a sibling", async () => {
        const {root_view, leaf_view, sibling_view} = await build_tree()
        const messages = await warnings(async () => {
          let done = false
          leaf_view.schedule(async () => {
            await sibling_view.ready
            done = true
          })
          await root_view.ready
          expect(done).to.be.true
        })
        expect(messages).to.be.equal([])
      })

      it("which doesn't warn when a synchronous task requests ready of its view", async () => {
        const view = await build_view(SomeModel.create())
        const messages = await warnings(async () => {
          let done = false
          view.schedule(() => {
            void view.ready.then(() => done = true)
          })
          await view.ready
          expect(done).to.be.true
        })
        expect(messages).to.be.equal([])
      })
    })

    it("should support ViewQuery", async () => {
      const obj0 = SomeModel.create()
      const obj1 = SomeModel.create()
      const obj2 = SomeModel.create()
      const obj3 = SomeModel.create({children: [obj0]})
      const obj4 = SomeModel.create({children: [obj1, obj2]})
      const obj5 = SomeModel.create({children: [obj3, obj4]})

      const view5 = await build_view(obj5, {parent: null})

      const view0 = view5.views.find_one(obj0)
      expect_not_null(view0)
      const view1 = view5.views.find_one(obj1)
      expect_not_null(view1)
      const view2 = view5.views.find_one(obj2)
      expect_not_null(view2)
      const view3 = view5.views.find_one(obj3)
      expect_not_null(view3)
      const view4 = view5.views.find_one(obj4)
      expect_not_null(view4)

      expect([...view5.views.all_views()]).to.be.equal([view5, view3, view0, view4, view1, view2])

      expect(view0.children_views()).to.be.equal([])
      expect(view1.children_views()).to.be.equal([])
      expect(view2.children_views()).to.be.equal([])
      expect(view3.children_views()).to.be.equal([view0])
      expect(view4.children_views()).to.be.equal([view1, view2])
      expect(view5.children_views()).to.be.equal([view3, view4])
    })
  })
})
