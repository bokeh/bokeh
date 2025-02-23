import * as sinon from "sinon"

import {expect} from "assertions"
import {display} from "../../../framework"
import {restorable} from "../../_util"

import {UIElement, UIElementView} from "@bokehjs/models/ui/ui_element"
import {BBox} from "@bokehjs/core/util/bbox"
import {paint} from "@bokehjs/core/util/defer"
import type {StyleSheetLike} from "@bokehjs/core/dom"
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
    const ui = new UI({
      stylesheets: [":host { background-color: #f00; }"],
      css_variables: {"--foo": "violet"},
      visible: false,
    })
    const {view} = await display(ui, [100, 100])

    using render_spy = restorable(sinon.spy(view, "render"))

    const stylesheets = () => {
      return [...view.shadow_el.children]
        .filter((c) => c instanceof HTMLStyleElement)
        .map((c) => c.textContent)
    }

    expect(stylesheets()).to.be.equal([
      base_css,
      ":host {\n--foo: violet;\n}",          // StyledElement.css_variables
      ":host{position:relative;}",           // ui.css
      ":host { background-color: #000; }",   // UIView.stylesheets
      "",                                    // StyledElement.style
      ":host { display: none; }",            // UIElementView._display
      ":host { background-color: #f00; }",   // UIElement.stylesheets
    ])

    ui.stylesheets = [...ui.stylesheets, ":host { background-color: #ff0; }"]
    await view.ready

    expect(stylesheets()).to.be.equal([
      base_css,
      ":host {\n--foo: violet;\n}",          // StyledElement.css_variables
      ":host{position:relative;}",           // ui.css
      ":host { background-color: #000; }",   // UIView.stylesheets
      "",                                    // StyledElement.style
      ":host { display: none; }",            // UIElementView._display
      ":host { background-color: #f00; }",   // UIElement.stylesheets
      ":host { background-color: #ff0; }",   // UIElement.stylesheets
    ])
    expect(render_spy.callCount).to.be.equal(0)
  })

  describe("should detect if the host element is displayed", () => {
    const size = {width: "50px", height: "75px"}

    it("under normal conditions", async () => {
      const ui = new UI({styles: {...size}})
      const {view} = await display(ui, [100, 100])
      expect(view.is_displayed).to.be.true
      expect(view.bbox).to.be.equal(new BBox({x: 0, y: 0, width: 50, height: 75}))
    })

    it("when using 'visibility: hidden'", async () => {
      const ui = new UI({styles: {...size, visibility: "hidden"}})
      const {view} = await display(ui, [100, 100])
      expect(view.is_displayed).to.be.true
      expect(view.bbox).to.be.equal(new BBox({x: 0, y: 0, width: 50, height: 75}))
    })

    it("when using 'display: none'", async () => {
      const ui = new UI({styles: {...size, display: "none"}})
      const {view} = await display(ui, [100, 100])
      expect(view.is_displayed).to.be.false
      expect(view.bbox).to.be.equal(new BBox({x: 0, y: 0, width: 0, height: 0}))
    })

    it("when using 'position: fixed'", async () => {
      const ui = new UI({styles: {...size, position: "fixed"}})
      const {view} = await display(ui, [100, 100])
      expect(view.is_displayed).to.be.true
      expect(view.bbox).to.be.equal(new BBox({x: 0, y: 0, width: 50, height: 75}))
    })

    it("when using 'position: fixed' and 'display: none'", async () => {
      const ui = new UI({styles: {...size, position: "fixed", display: "none"}})
      const {view} = await display(ui, [100, 100])
      expect(view.is_displayed).to.be.false
      expect(view.bbox).to.be.equal(new BBox({x: 0, y: 0, width: 0, height: 0}))
    })

    it("when not connected to DOM", async () => {
      const ui = new UI({styles: {...size}})
      const {view} = await display(ui, [100, 100], null)
      expect(view.is_displayed).to.be.false
      expect(view.bbox).to.be.equal(new BBox({x: 0, y: 0, width: 0, height: 0}))
    })

    it("when switched to 'display: none' after display", async () => {
      const ui = new UI({styles: {...size}})
      const {view} = await display(ui, [100, 100])
      await paint()

      ui.styles = {...size, display: "none"}
      await paint()

      expect(view.is_displayed).to.be.false
      expect(view.bbox).to.be.equal(new BBox({x: 0, y: 0, width: 0, height: 0}))
    })

    it("when disconnected from DOM after display", async () => {
      const ui = new UI({styles: {...size}})
      const {view} = await display(ui, [100, 100])

      expect(view.is_displayed).to.be.true
      expect(view.bbox).to.be.equal(new BBox({x: 0, y: 0, width: 50, height: 75}))

      view.el.remove()
      await paint()
      await paint() // TODO: we need to await resize

      expect(view.is_displayed).to.be.false
      expect(view.bbox).to.be.equal(new BBox({x: 0, y: 0, width: 0, height: 0}))
    })
  })

  it("should support html_id", async () => {
    const ui = new UI({html_id: "my_id"})
    const {view} = await display(ui, [100, 100])

    expect(view.el.getAttribute("id")).to.be.equal("my_id")

    ui.html_id = "my_id2"
    await view.ready

    expect(view.el.getAttribute("id")).to.be.equal("my_id2")

    ui.html_id = null
    await view.ready

    expect(view.el.getAttribute("id")).to.be.null

    ui.html_id = "my_id3"
    await view.ready

    expect(view.el.getAttribute("id")).to.be.equal("my_id3")
  })

  it("should support html_attributes", async () => {
    const ui = new UI({html_attributes: {role: "button"}})
    const {view} = await display(ui, [100, 100])

    expect(view.el.getAttribute("role")).to.be.equal("button")
    expect(view.el.getAttribute("aria-label")).to.be.null

    ui.html_attributes = {...ui.html_attributes, "aria-label": "something"}
    await view.ready

    expect(view.el.getAttribute("role")).to.be.equal("button")
    expect(view.el.getAttribute("aria-label")).to.be.equal("something")

    ui.html_attributes = {}
    await view.ready

    expect(view.el.getAttribute("role")).to.be.null
    expect(view.el.getAttribute("aria-label")).to.be.null
  })

  it("should prefer html_id over html_attributes", async () => {
    const ui = new UI({html_id: "my_actual_id", html_attributes: {id: "my_id"}})
    const {view} = await display(ui, [100, 100])

    expect(view.el.getAttribute("id")).to.be.equal("my_actual_id")

    ui.html_id = null
    await view.ready

    expect(view.el.getAttribute("id")).to.be.equal("my_id")
  })

  it("should merge css_classes with html_attributes['class']", async () => {
    const ui = new UI({
      css_classes: ["a", "b"],
      html_attributes: {class: "c d"},
    })
    const {view} = await display(ui, [100, 100])

    expect([...view.el.classList]).to.be.equal(["bk-UI", "cls0", "cls1", "a", "b", "c", "d", "render0"])

    ui.html_attributes = {}
    await view.ready

    // TODO preserve order of "render0"
    expect([...view.el.classList]).to.be.equal(["render0", "bk-UI", "cls0", "cls1", "a", "b"])

    ui.css_classes = []
    await view.ready

    expect([...view.el.classList]).to.be.equal(["render0", "bk-UI", "cls0", "cls1"])

    ui.html_attributes = {class: "e f"}
    await view.ready

    expect([...view.el.classList]).to.be.equal(["render0", "bk-UI", "cls0", "cls1", "e", "f"])
  })
})
