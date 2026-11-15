import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"

import * as sinon from "sinon"

import {Drawer} from "@bokehjs/models/ui/drawer"
import {MouseButton} from "@bokehjs/core/dom"
import * as drawers_css from "@bokehjs/styles/drawers.css"

describe("models/ui/drawer module", () => {
  describe("DrawerView", () => {
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

    it("should stop handling a gesture in progress after being removed", async () => {
      const drawer = Drawer.create({location: "left", resizable: true, open: true})
      const {view} = await display(drawer, null)

      const handle_el = view.shadow_el.querySelector<HTMLElement>(`.${drawers_css.handle}`)
      expect(handle_el).to.not.be.null

      const on_pan = sinon.spy(view, "on_pan")
      try {
        handle_el!.dispatchEvent(pointer("pointerdown", 100, 100))
        handle_el!.dispatchEvent(pointer("pointermove", 110, 100))
        expect(on_pan.callCount).to.be.equal(1)

        view.remove()
        expect(handle_el!.style.userSelect).to.be.equal("")

        handle_el!.dispatchEvent(pointer("pointermove", 120, 100))
        handle_el!.dispatchEvent(pointer("pointerup", 120, 100))
        expect(on_pan.callCount).to.be.equal(1)
      } finally {
        on_pan.restore()
      }
    })
  })
})
