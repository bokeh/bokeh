import {expect} from "chai"
import * as sinon from "sinon"

import {CheckboxButtonGroup} from "@bokehjs/models/widgets/checkbox_button_group"
import {CustomJS} from "@bokehjs/models/callbacks/customjs"
import {build_view} from "@bokehjs/core/build_views"

describe("CheckboxButtonGroup", () => {

  describe("change_active", () => {

    it("should add arg to active if not present", async () => {
      const g = new CheckboxButtonGroup({active: [0, 2]})
      const view = (await build_view(g)).build()
      view.change_active(1)
      expect(g.active).to.deep.equal([0, 1, 2])
    })

    it("should remove arg from active if is present", async () => {
      const g = new CheckboxButtonGroup({active: [0, 1, 2]})
      const view = (await build_view(g)).build()
      view.change_active(1)
      expect(g.active).to.deep.equal([0, 2])
      view.change_active(2)
      expect(g.active).to.deep.equal([0])
    })

    it("should call a callback if present", async () => {
      const cb = new CustomJS()
      const spy = sinon.spy(cb, 'execute')
      const g = new CheckboxButtonGroup({active: [0, 1, 2], callback: cb})
      const view = (await build_view(g)).build()
      view.change_active(1)
      expect(spy.calledOnce).to.be.true
      expect(spy.calledWith(g)).to.be.true
    })

    it("should trigger on change", async () => {
      const g = new CheckboxButtonGroup({active: [0, 1, 2], labels: ["foo", "bar", "baz"]})
      const view = (await build_view(g)).build()

      const spy = sinon.spy(view, 'change_active')
      expect(spy.called).to.be.false
      expect(g.active).to.be.deep.equal([0, 1, 2])

      const button = view.el.querySelector<HTMLElement>('.bk-btn:nth-child(1)')
      button!.click()

      expect(spy.callCount).to.be.equal(1)
      expect(g.active).to.be.deep.equal([1, 2])
    })
  })
})
