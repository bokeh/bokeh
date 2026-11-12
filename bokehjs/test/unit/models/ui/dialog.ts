import {expect, expect_not_null} from "#framework/assertions"

import {Dialog} from "@bokehjs/models/ui/dialog"
import {HTML, HTMLView} from "@bokehjs/models/dom/html"
import {build_view} from "@bokehjs/core/build_views"
import * as dialogs from "@bokehjs/styles/dialogs.css"

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
})
