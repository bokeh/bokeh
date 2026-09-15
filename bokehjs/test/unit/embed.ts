import {expect} from "#framework/assertions"

import {mount} from "@bokehjs/api/io"
import {index} from "@bokehjs/embed/standalone"
import {Document} from "@bokehjs/document"
import {HasProps} from "@bokehjs/core/has_props"
import {DOMElementView} from "@bokehjs/core/dom_view"
import {is_equal} from "@bokehjs/core/util/eq"
import {defer} from "@bokehjs/core/util/defer"

class SomeView extends DOMElementView {
  render(): void {
    this.el.style.width = "100px"
    this.el.style.height = "100px"
    this.el.style.backgroundColor = "red"
    this.finish()
  }
}

class ModelWithoutView extends HasProps {}

class ModelWithView extends HasProps {
  declare __view_type__: SomeView

  static {
    this.prototype.default_view = SomeView
  }
}

let finish_deferred_view: (() => void) | undefined

class DeferredView extends DOMElementView {
  render(): void {
    finish_deferred_view = () => this.finish()
  }
}

class ModelWithDeferredView extends HasProps {
  declare __view_type__: DeferredView

  static {
    this.prototype.default_view = DeferredView
  }
}

describe("embed", () => {
  describe("mount()", () => {
    it("notifies idle on models without views", async () => {
      const doc = new Document()
      doc.add_root(ModelWithoutView.create())
      doc.add_root(ModelWithView.create())
      const mounted = mount(doc, document.body)
      await mounted.ready
      try {
        expect(doc.is_idle).to.be.true
      } finally {
        await mounted.dispose()
      }
    })

    it("doesn't resolve readiness before root views finish", async () => {
      const model = ModelWithDeferredView.create()
      const mounted = mount(new Document({roots: [model]}), document.body)
      let ready = false
      void mounted.ready.then(() => ready = true)
      await defer()
      try {
        expect(ready).to.be.false
        finish_deferred_view!()
        await mounted.ready
        expect(ready).to.be.true
        expect(model.document!.is_idle).to.be.true
      } finally {
        finish_deferred_view = undefined
        await mounted.dispose()
      }
    })
  })

  it("should support view index", async () => {
    const doc = new Document({roots: [ModelWithView.create()]})
    const mounted = mount(doc, document.body)
    await mounted.ready
    try {
      const views = [...mounted.view_lookup]
      expect(views.length).to.be.equal(2) // root + notifications
      const [view] = views

      expect(index[view.model.id]).to.be.equal(view)

      // index is a global registry, so we can't simply compare it with views
      const keys = Object.keys(index)
      expect(keys.includes(view.model.id)).to.be.true

      const values = Object.values(index)
      expect(values.includes(view)).to.be.true

      const entries = Object.entries(index)
      expect(entries.some((entry) => is_equal(entry, [view.model.id, view]))).to.be.true
    } finally {
      await mounted.dispose()
    }
  })
})
