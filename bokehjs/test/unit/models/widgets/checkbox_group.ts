import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"

import {CheckboxGroup} from "@bokehjs/models/widgets/checkbox_group"

describe("CheckboxGroup", () => {

  describe("change_active", () => {

    it("should keep active sorted numerically", async () => {
      const labels = Array.from({length: 12}, (_, i) => `label ${i}`)
      const g = CheckboxGroup.create({active: [2], labels})
      const {view} = await display(g, null)
      view.change_active(10)
      expect(g.active).to.be.equal([2, 10])
      view.change_active(1)
      expect(g.active).to.be.equal([1, 2, 10])
      view.change_active(2)
      expect(g.active).to.be.equal([1, 10])
    })
  })
})
