import * as sinon from "sinon"

import {expect} from "assertions"
import {display} from "../../../framework"

import {UIElement, UIElementView} from "@bokehjs/models/ui/ui_element"
import {StyleSheetLike} from "@bokehjs/core/dom"
import base_css from "@bokehjs/styles/base.css"

class UIView extends UIElementView {
  declare model: UI

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), ":host { background-color: #000; }"]
  }

  override css_classes(): string[] {
    return [...super.css_classes(), "cls0", "cls1"]
  }

  override render(): void {
    super.render()
    this.class_list.add("render0")
  }
}

interface UI extends UIElement {}

class UI extends UIElement {
  declare __view_type__: UIView

  static {
    this.prototype.default_view = UIView
  }
}

describe("UIElement", () => {
  it("should allow updating 'css_classes' without re-rendering", async () => {
    const ui = new UI({css_classes: ["user_cls0", "user_cls1"]})
    const {view} = await display(ui, [100, 100])

    const render_spy = sinon.spy(view, "render")
    try {
      expect([...view.el.classList]).to.be.equal(["bk-UI", "cls0", "cls1", "user_cls0", "user_cls1", "render0"])

      ui.css_classes = [...ui.css_classes, "user_cls2"]
      await view.ready

      // TODO: preserve order
      expect([...view.el.classList]).to.be.equal(["render0", "bk-UI", "cls0", "cls1", "user_cls0", "user_cls1", "user_cls2"])
      expect(render_spy.callCount).to.be.equal(0)
    } finally {
      render_spy.restore()
    }
  })

  it("should allow updating 'stylesheets' without re-rendering", async () => {
    const ui = new UI({stylesheets: [":host { background-color: #f00; }"]})
    const {view} = await display(ui, [100, 100])

    const render_spy = sinon.spy(view, "render")
    try {
      const stylesheets = () => [...view.shadow_el.children]
        .filter((c) => c instanceof HTMLStyleElement).map((c) => c.textContent)

      expect(stylesheets()).to.be.equal([
        base_css,
        ":host{position:relative;}",
        ":host { background-color: #000; }",
        "", // style
        "", // _display
        ":host { background-color: #f00; }",
      ])

      ui.stylesheets = [...ui.stylesheets, ":host { background-color: #ff0; }"]
      await view.ready

      expect(stylesheets()).to.be.equal([
        base_css,
        ":host{position:relative;}",
        ":host { background-color: #000; }",
        "", // style
        "", // _display
        ":host { background-color: #f00; }",
        ":host { background-color: #ff0; }",
      ])
      expect(render_spy.callCount).to.be.equal(0)
    } finally {
      render_spy.restore()
    }
  })
})
