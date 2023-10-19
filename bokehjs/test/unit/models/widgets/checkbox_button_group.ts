import * as sinon from "sinon"

import {expect, expect_not_null} from "assertions"
import {display} from "../../_util"

import {CheckboxButtonGroup} from "@bokehjs/models/widgets/checkbox_button_group"

describe("CheckboxButtonGroup", () => {

  describe("change_active", () => {

    it("should add arg to active if not present", async () => {
      const g = new CheckboxButtonGroup({active: [0, 2], labels: ["foo", "bar", "baz"]})
      const {view} = await display(g, null)
      view.change_active(1)
      expect(g.active).to.be.equal([0, 1, 2])
    })

    it("should remove arg from active if is present", async () => {
      const g = new CheckboxButtonGroup({active: [0, 1, 2], labels: ["foo", "bar", "baz"]})
      const {view} = await display(g, null)
      view.change_active(1)
      expect(g.active).to.be.equal([0, 2])
      view.change_active(2)
      expect(g.active).to.be.equal([0])
    })

    it("should trigger on change", async () => {
      const g = new CheckboxButtonGroup({active: [0, 1, 2], labels: ["foo", "bar", "baz"]})
      const {view} = await display(g, null)

      const spy = sinon.spy(view, "change_active")
      expect(spy.called).to.be.false
      expect(g.active).to.be.equal([0, 1, 2])

      const button = view.shadow_el.querySelector<HTMLElement>(".bk-btn:nth-child(1)")
      expect_not_null(button)
      button.click()

      expect(spy.callCount).to.be.equal(1)
      expect(g.active).to.be.equal([1, 2])
    })
  })
})
