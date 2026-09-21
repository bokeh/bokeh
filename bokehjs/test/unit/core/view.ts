import {expect, expect_not_null} from "#framework/assertions"

import {HasProps} from "@bokehjs/core/has_props"
import {View} from "@bokehjs/core/view"
import type {ChildView, ViewStorage} from "@bokehjs/core/build_views"
import {build_view, build_views} from "@bokehjs/core/build_views"
import type * as p from "@bokehjs/core/properties"
import {Ref, List} from "@bokehjs/core/kinds"

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
