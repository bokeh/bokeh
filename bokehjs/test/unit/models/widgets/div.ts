import * as sinon from "sinon"

import {expect, expect_not_null} from "#framework/assertions"
import {display} from "#framework/layouts"
import {restorable} from "#framework/util"

import {Div} from "@bokehjs/models/widgets/div"
import {Column} from "@bokehjs/models/layouts/column"
import type {DivView} from "@bokehjs/models/widgets/div"
import {paint} from "@bokehjs/core/util/defer"

describe("DivView", () => {
  describe("in issue #14178", () => {
    // Following a link changes the test page's URL and scroll position, so restore them.
    let url: string
    before_each(() => {
      url = window.location.href
    })
    after_each(() => {
      window.history.replaceState(null, "", url)
      window.scrollTo(0, 0)
    })

    // Clicking a link changes the test page's URL, so cancel that once the click has reached
    // the window. Returns whether the click's default action was already prevented by then.
    function click(el: HTMLElement, init: MouseEventInit = {}): boolean {
      let prevented = false
      const cancel = (event: Event) => {
        prevented = event.defaultPrevented
        event.preventDefault()
      }
      window.addEventListener("click", cancel, {once: true})
      try {
        el.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true, composed: true, button: 0, ...init}))
      } finally {
        window.removeEventListener("click", cancel)
      }
      return prevented
    }

    function link(view: DivView, selector: string): HTMLAnchorElement {
      const el = view.shadow_el.querySelector<HTMLAnchorElement>(selector)
      expect_not_null(el)
      return el
    }

    it("should scroll to the target of a fragment link in the same Div", async () => {
      const div = Div.create({text: '<a href="#target0">link</a><p>text</p><h1 id="target0">target</h1>'})
      const {view} = await display(div, [200, 200])
      using spy = restorable(sinon.spy(Element.prototype, "scrollIntoView"))

      click(link(view, 'a[href="#target0"]'))

      expect(spy.callCount).to.be.equal(1)
      expect(spy.thisValues[0]).to.be.equal(view.shadow_el.getElementById("target0"))
      expect(window.location.hash).to.be.equal("#target0")
    })

    it("should scroll to the target of a fragment link in another Div", async () => {
      const div0 = Div.create({text: '<a href="#target1">link</a>'})
      const div1 = Div.create({text: '<h1 id="target1">target</h1>'})
      const col = Column.create({children: [div0, div1]})
      const {view} = await display(col, [200, 200])
      const view0 = view.owner.get_one(div0)
      const view1 = view.owner.get_one(div1)
      using spy = restorable(sinon.spy(Element.prototype, "scrollIntoView"))

      click(link(view0, 'a[href="#target1"]'))

      expect(spy.callCount).to.be.equal(1)
      expect(spy.thisValues[0]).to.be.equal(view1.shadow_el.getElementById("target1"))
    })

    it("should support targets given by <a name> and percent-encoded fragments", async () => {
      const div = Div.create({text: '<a href="#t%C3%A4rget">link</a><a name="tärget">target</a>'})
      const {view} = await display(div, [200, 200])
      using spy = restorable(sinon.spy(Element.prototype, "scrollIntoView"))

      click(link(view, 'a[href="#t%C3%A4rget"]'))

      expect(spy.callCount).to.be.equal(1)
      expect(spy.thisValues[0]).to.be.equal(view.shadow_el.querySelector('a[name="tärget"]'))
    })

    it("should leave fragment links to targets in the document to the browser", async () => {
      const target = document.createElement("h1")
      target.id = "target2"
      document.body.append(target)
      try {
        const div = Div.create({text: '<a href="#target2">link</a><h1 id="target2">target</h1>'})
        const {view} = await display(div, [200, 200])
        using spy = restorable(sinon.spy(Element.prototype, "scrollIntoView"))

        click(link(view, 'a[href="#target2"]'))

        expect(spy.callCount).to.be.equal(0)
      } finally {
        target.remove()
      }
    })

    it("should ignore modified clicks, other windows, downloads, missing targets and other links", async () => {
      const div = Div.create({text: '<a href="#target3">link</a><a href="#target3" target="_blank">new tab</a><a href="#target3" download>download</a><a href="#missing">missing</a><a href="https://bokeh.org/">other</a><h1 id="target3">target</h1>'})
      const {view} = await display(div, [200, 200])
      using spy = restorable(sinon.spy(Element.prototype, "scrollIntoView"))

      click(link(view, 'a[href="#target3"]'), {ctrlKey: true})
      click(link(view, 'a[href="#target3"]'), {button: 1})
      click(link(view, 'a[target="_blank"]'))
      click(link(view, "a[download]"))
      click(link(view, 'a[href="#missing"]'))
      click(link(view, 'a[href="https://bokeh.org/"]'))

      expect(spy.callCount).to.be.equal(0)
    })

    it("should scroll to a target named 'top' and update the URL, when navigation isn't cancelled", async () => {
      const div = Div.create({text: '<a href="#top">link</a><div style="height: 200vh"></div><h1 id="top">target</h1><div style="height: 200vh"></div>'})
      const {view} = await display(div, null)
      const target = view.shadow_el.getElementById("top")
      expect_not_null(target)
      const hashchange = new Promise<HashChangeEvent>((resolve) => {
        window.addEventListener("hashchange", resolve, {once: true})
      })

      // Unlike click(), let the browser follow the link.
      link(view, 'a[href="#top"]').click()
      const event = await hashchange
      await paint()

      expect(new URL(event.newURL).hash).to.be.equal("#top")
      expect(window.location.hash).to.be.equal("#top")
      expect(window.scrollY).to.be.above(0)
      expect(Math.abs(target.getBoundingClientRect().top)).to.be.below(1)
    })

    it("should leave links to other windows given by <base target> to the browser", async () => {
      const div = Div.create({text: '<a href="#target4">link</a><a href="#target4" target="_self">this window</a><h1 id="target4">target</h1>'})
      const {view} = await display(div, [200, 200])
      using spy = restorable(sinon.spy(Element.prototype, "scrollIntoView"))

      const base = document.createElement("base")
      base.target = "_blank"
      document.head.append(base)
      try {
        expect(click(link(view, "a:not([target])"))).to.be.false
        expect(spy.callCount).to.be.equal(0)
        expect(window.location.href).to.be.equal(url)

        // An explicit target takes precedence over <base target>.
        expect(click(link(view, 'a[target="_self"]'))).to.be.true
        expect(spy.callCount).to.be.equal(1)
      } finally {
        base.remove()
      }
    })

    it("should leave links to other documents given by <base href> to the browser", async () => {
      const div = Div.create({text: '<a href="#target5">link</a><h1 id="target5">target</h1>'})
      const {view} = await display(div, [200, 200])
      using spy = restorable(sinon.spy(Element.prototype, "scrollIntoView"))

      const base = document.createElement("base")
      base.href = "https://bokeh.org/"
      document.head.append(base)
      try {
        expect(click(link(view, 'a[href="#target5"]'))).to.be.false
        expect(spy.callCount).to.be.equal(0)
        expect(window.location.href).to.be.equal(url)
      } finally {
        base.remove()
      }
    })
  })
})
