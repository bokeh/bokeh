import {expect} from "assertions"

import * as embed from "@bokehjs/embed"
import {index} from "@bokehjs/embed/standalone"
import {Document} from "@bokehjs/document"
import {HasProps} from "@bokehjs/core/has_props"
import {DOMElementView} from "@bokehjs/core/dom_view"
import {is_equal} from "@bokehjs/core/util/eq"

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

describe("embed", () => {
  it("should have an empty 'kernels' dict on the embed module", () => {
    expect(embed.kernels).to.be.equal({})
  })

  describe("implements add_document_standalone()", () => {
    it("which notifies idle on models without views", async () => {
      const doc = new Document()
      doc.add_root(new ModelWithoutView())
      doc.add_root(new ModelWithView())
      const views = await embed.add_document_standalone(doc, document.body)
      try {
        expect(doc.is_idle).to.be.true
      } finally {
        views.clear()
      }
    })
  })

  it("should support view index", async () => {
    const doc = new Document({roots: [new ModelWithView]})
    const views = await embed.add_document_standalone(doc, document.body)
    try {
      expect(views.roots.length).to.be.equal(1)
      const [view] = views.roots

      expect(index[view.model.id]).to.be.equal(view)

      // index is a global registry, so we can't simply compare it with views
      const keys = Object.keys(index)
      expect(keys.includes(view.model.id)).to.be.true

      const values = Object.values(index)
      expect(values.includes(view)).to.be.true

      const entries = Object.entries(index)
      expect(entries.some((entry) => is_equal(entry, [view.model.id, view]))).to.be.true
    } finally {
      views.clear()
    }
  })
})
