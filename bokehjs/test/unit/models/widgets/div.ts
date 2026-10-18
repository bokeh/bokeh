import * as sinon from "sinon"

import {expect, expect_not_null} from "#framework/assertions"
import {display} from "#framework/layouts"
import {restorable} from "#framework/util"

import {Div} from "@bokehjs/models/widgets/div"
import {Column} from "@bokehjs/models/layouts/column"
import type {DivView} from "@bokehjs/models/widgets/div"

describe("DivView", () => {
  describe("in issue #14178", () => {
    // Clicking a link changes the test page's URL, so cancel that once the click has reached the window.
    function click(el: HTMLElement, init: MouseEventInit = {}): void {
      const cancel = (event: Event) => event.preventDefault()
      window.addEventListener("click", cancel, {once: true})
      try {
        el.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true, composed: true, button: 0, ...init}))
      } finally {
        window.removeEventListener("click", cancel)
      }
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

    it("should ignore modified clicks, other windows, missing targets and other links", async () => {
      const div = Div.create({text: '<a href="#target3">link</a><a href="#target3" target="_blank">new tab</a><a href="#missing">missing</a><a href="https://bokeh.org/">other</a><h1 id="target3">target</h1>'})
      const {view} = await display(div, [200, 200])
      using spy = restorable(sinon.spy(Element.prototype, "scrollIntoView"))

      click(link(view, 'a[href="#target3"]'), {ctrlKey: true})
      click(link(view, 'a[href="#target3"]'), {button: 1})
      click(link(view, 'a[target="_blank"]'))
      click(link(view, 'a[href="#missing"]'))
      click(link(view, 'a[href="https://bokeh.org/"]'))

      expect(spy.callCount).to.be.equal(0)
    })
  })
})
