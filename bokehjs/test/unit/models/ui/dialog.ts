import {expect, expect_not_null} from "#framework/assertions"
import {display} from "#framework/layouts"

import {Dialog} from "@bokehjs/models/ui/dialog"
import {Pane} from "@bokehjs/models/ui/pane"
import {HTML, HTMLView} from "@bokehjs/models/dom/html"
import {Div, DivView} from "@bokehjs/models/widgets/div"
import {Node} from "@bokehjs/models/coordinates/node"
import {build_view} from "@bokehjs/core/build_views"
import {bounding_box, MouseButton} from "@bokehjs/core/dom"
import * as dialogs from "@bokehjs/styles/dialogs.css"

describe("models/ui/dialog module", () => {
  describe("Dialog", () => {
    it("should only allow nodes as limits", () => {
      const node = Node.create({target: "parent", symbol: "left"})
      expect(Dialog.create({left_limit: node}).left_limit).to.be.identical(node)
      expect(() => Dialog.create({left_limit: 100 as any})).to.throw()
    })
  })

  describe("DialogView", () => {
    async function build(dialog: Dialog) {
      const view = await build_view(dialog)
      dialog.visible = true
      const title_el = view.shadow_el.querySelector(`.${dialogs.title}`)
      const content_el = view.shadow_el.querySelector(`.${dialogs.content}`)
      expect_not_null(title_el)
      expect_not_null(content_el)
      return {view, title_el, content_el}
    }

    it("should render string title and content as plain text", async () => {
      const dialog = Dialog.create({title: "<b>title</b>", content: "<i>content</i>", visible: false})
      const {view, title_el, content_el} = await build(dialog)
      try {
        expect(title_el.textContent).to.be.equal("<b>title</b>")
        expect(content_el.textContent).to.be.equal("<i>content</i>")
        expect(view.children_views().some((child) => child instanceof HTMLView)).to.be.false
      } finally {
        view.remove()
      }
    })

    it("should render vDOM based title and content", async () => {
      const dialog = Dialog.create({
        title: Div.create({text: "<b>title0</b>"}),
        content: Div.create({text: "<i>content0</i>"}),
        visible: false,
      })
      const {view, title_el, content_el} = await build(dialog)
      try {
        function rendered(el: Element): string[] {
          const div_views = view.children_views().filter((child) => child instanceof DivView)
          return div_views.filter((div_view) => el.contains(div_view.el)).map((div_view) => div_view.shadow_el.textContent)
        }

        expect(rendered(title_el)).to.be.equal(["title0"])
        expect(rendered(content_el)).to.be.equal(["content0"])

        dialog.title = Div.create({text: "<b>title1</b>"})
        dialog.content = Div.create({text: "<i>content1</i>"})
        await view.ready
        expect(rendered(title_el)).to.be.equal(["title1"])
        expect(rendered(content_el)).to.be.equal(["content1"])
      } finally {
        view.remove()
      }
    })

    it("should update when 'title' and 'content' change", async () => {
      const dialog = Dialog.create({title: "title0", content: "content0", visible: false})
      const {view, title_el, content_el} = await build(dialog)
      try {
        dialog.title = "title1"
        dialog.content = "content1"
        await view.ready
        expect(title_el.textContent).to.be.equal("title1")
        expect(content_el.textContent).to.be.equal("content1")

        dialog.title = HTML.create({html: "<b>title2</b>"})
        dialog.content = HTML.create({html: "<i>content2</i>"})
        await view.ready
        expect(title_el.querySelector("b")?.textContent).to.be.equal("title2")
        expect(content_el.querySelector("i")?.textContent).to.be.equal("content2")

        const html_views = view.children_views().filter((child) => child instanceof HTMLView)
        expect(html_views.length).to.be.equal(2)

        dialog.title = null
        dialog.content = "content3"
        await view.ready
        expect(title_el.textContent).to.be.equal("")
        expect(content_el.textContent).to.be.equal("content3")
        expect(html_views.every((html_view) => html_view.is_destroyed)).to.be.true
      } finally {
        view.remove()
      }
    })

    it("should not let superseded 'title' and 'content' builds overwrite newer ones", async () => {
      const dialog = Dialog.create({title: "title0", content: "content0", visible: false})
      const {view, title_el, content_el} = await build(dialog)
      try {
        const html_views = () => view.children_views().filter((child) => child instanceof HTMLView)

        dialog.title = HTML.create({html: "<b>title1</b>"})
        dialog.content = HTML.create({html: "<i>content1</i>"})
        dialog.title = "title2"
        dialog.content = "content2"
        await view.ready

        expect(title_el.textContent).to.be.equal("title2")
        expect(content_el.textContent).to.be.equal("content2")
        expect(html_views().length).to.be.equal(0)

        dialog.title = HTML.create({html: "<b>title3</b>"})
        dialog.content = HTML.create({html: "<i>content3</i>"})
        dialog.title = HTML.create({html: "<b>title4</b>"})
        dialog.content = HTML.create({html: "<i>content4</i>"})
        await view.ready

        expect(title_el.querySelector("b")?.textContent).to.be.equal("title4")
        expect(content_el.querySelector("i")?.textContent).to.be.equal("content4")
        expect(html_views().length).to.be.equal(2)
      } finally {
        view.remove()
      }
    })

    function pointer(type: string, x: number, y: number): PointerEvent {
      return new PointerEvent(type, {
        bubbles: true,
        composed: true,
        cancelable: true,
        isPrimary: true,
        pointerType: "mouse",
        pointerId: 1,
        buttons: type == "pointerdown" ? MouseButton.Left : 0,
        clientX: x,
        clientY: y,
      })
    }

    function escape(): void {
      document.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true, cancelable: true}))
    }

    async function new_dialog(attrs: Partial<Dialog.Attrs> = {}) {
      const dialog = Dialog.create({
        title: "A dialog",
        content: "Content",
        ...attrs,
      })
      const {view} = await display(dialog, null)

      const handle = (cls: string) => {
        const el = view.shadow_el.querySelector<HTMLElement>(`.${cls}`)
        expect(el).to.not.be.null
        return el!
      }

      const bbox = () => {
        const {left, top, width, height} = bounding_box(view.el)
        return {left, top, width, height}
      }

      return {view, handle, bbox}
    }

    function drag(el: HTMLElement, [x0, y0]: [number, number], [x1, y1]: [number, number], end: "up" | "escape" | "cancel" = "up"): void {
      el.dispatchEvent(pointer("pointerdown", x0, y0))
      el.dispatchEvent(pointer("pointermove", (x0 + x1)/2, (y0 + y1)/2))
      el.dispatchEvent(pointer("pointermove", x1, y1))
      switch (end) {
        case "up": {
          el.dispatchEvent(pointer("pointerup", x1, y1))
          break
        }
        case "escape": {
          escape()
          el.dispatchEvent(pointer("pointerup", x1, y1))
          break
        }
        case "cancel": {
          el.dispatchEvent(pointer("pointercancel", 0, 0))
          break
        }
      }
    }

    it("should support moving by the title", async () => {
      const {handle, bbox} = await new_dialog()
      const initial = bbox()

      drag(handle(dialogs.title), [100, 60], [130, 80])
      expect(bbox()).to.be.equal({...initial, left: initial.left + 30, top: initial.top + 20})
    })

    it("should support resizing by a corner", async () => {
      const {handle, bbox} = await new_dialog()
      const initial = bbox()

      drag(handle(dialogs.resize_bottom_right), [250, 200], [270, 230])
      expect(bbox()).to.be.equal({...initial, width: initial.width + 20, height: initial.height + 30})
    })

    it("should support movable == 'x'", async () => {
      const {handle, bbox} = await new_dialog({movable: "x"})
      const initial = bbox()

      drag(handle(dialogs.title), [100, 60], [130, 80])
      expect(bbox()).to.be.equal({...initial, left: initial.left + 30})
    })

    it("should not move when movable == 'none'", async () => {
      const {handle, bbox} = await new_dialog({movable: "none"})
      const initial = bbox()

      drag(handle(dialogs.title), [100, 60], [130, 80])
      expect(bbox()).to.be.equal(initial)
    })

    it("should restore the initial position when cancelled with Escape", async () => {
      const {view, handle, bbox} = await new_dialog()
      const initial = bbox()

      const title_el = handle(dialogs.title)
      title_el.dispatchEvent(pointer("pointerdown", 100, 60))
      title_el.dispatchEvent(pointer("pointermove", 130, 80))
      expect(bbox()).to.not.be.equal(initial)
      expect(view.el.classList.contains(dialogs.interacting)).to.be.true

      escape()
      expect(bbox()).to.be.equal(initial)
      expect(view.el.classList.contains(dialogs.interacting)).to.be.false

      // the rest of the gesture is ignored
      title_el.dispatchEvent(pointer("pointermove", 150, 90))
      title_el.dispatchEvent(pointer("pointerup", 150, 90))
      expect(bbox()).to.be.equal(initial)
    })

    it("should restore the initial position on pointercancel and allow further interaction", async () => {
      const {handle, bbox} = await new_dialog()
      const initial = bbox()

      drag(handle(dialogs.title), [100, 60], [130, 80], "cancel")
      expect(bbox()).to.be.equal(initial)

      drag(handle(dialogs.title), [100, 60], [110, 70])
      expect(bbox()).to.be.equal({...initial, left: initial.left + 10, top: initial.top + 10})
    })

    it("should resolve limits relative to the viewport", async () => {
      // the parent's position relative to the viewport differs from its `bbox`
      const inset = 20
      const parent_limit = (symbol: string) => Node.create({target: "parent", symbol})
      const dialog = Dialog.create({
        title: "A dialog",
        content: "Content",
        left_limit: parent_limit("left"),
        right_limit: parent_limit("right"),
        top_limit: parent_limit("top"),
        bottom_limit: parent_limit("bottom"),
      })
      const pane = Pane.create({
        elements: [dialog],
        stylesheets: [`:host { position: fixed; left: ${inset}px; right: ${inset}px; top: ${inset}px; bottom: ${inset}px; }`],
      })
      const {view: pane_view} = await display(pane, null)
      const view = pane_view.owner.get_one(dialog)

      const title_el = view.shadow_el.querySelector<HTMLElement>(`.${dialogs.title}`)
      expect_not_null(title_el)

      drag(title_el, [100, 60], [-5000, -5000])
      const {left, top} = bounding_box(view.el)
      expect({left, top}).to.be.equal({left: inset, top: inset})

      drag(title_el, [100, 60], [5000, 5000])
      const {right, bottom} = bounding_box(view.el)
      expect({right, bottom}).to.be.equal({right: innerWidth - inset, bottom: innerHeight - inset})
    })
  })
})
