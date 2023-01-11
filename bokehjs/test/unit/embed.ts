import {expect} from "assertions"

import * as embed from "@bokehjs/embed"
import {Document} from "@bokehjs/document"
import {HasProps} from "@bokehjs/core/has_props"
import {DOMElementView} from "@bokehjs/core/dom_view"

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
      await embed.add_document_standalone(doc, document.body)
      expect(doc.is_idle).to.be.true
    })
  })
})
