import {expect, expect_not_null} from "assertions"

import {HasProps} from "@bokehjs/core/has_props"
import {View} from "@bokehjs/core/view"
import type {ViewStorage} from "@bokehjs/core/build_views"
import {build_view, build_views, remove_views} from "@bokehjs/core/build_views"
import type * as p from "@bokehjs/core/properties"
import {Ref, List} from "@bokehjs/core/kinds"

class SomeModelView extends View {
  declare model: SomeModel

  protected _children_views: ViewStorage<HasProps> = new Map()

  override *children() {
    yield* super.children()
    yield* this._children_views.values()
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await build_views(this._children_views, this.model.children, {parent: this})
  }

  override remove(): void {
    remove_views(this._children_views)
    super.remove()
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

describe("core/view", () => {

  describe("View", () => {
    it("should support ViewQuery", async () => {
      const obj0 = new SomeModel()
      const obj1 = new SomeModel()
      const obj2 = new SomeModel()
      const obj3 = new SomeModel({children: [obj0]})
      const obj4 = new SomeModel({children: [obj1, obj2]})
      const obj5 = new SomeModel({children: [obj3, obj4]})

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

      expect([...view0.children()]).to.be.equal([])
      expect([...view1.children()]).to.be.equal([])
      expect([...view2.children()]).to.be.equal([])
      expect([...view3.children()]).to.be.equal([view0])
      expect([...view4.children()]).to.be.equal([view1, view2])
      expect([...view5.children()]).to.be.equal([view3, view4])
    })
  })
})
