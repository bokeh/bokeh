import {expect} from "chai"

import * as mixins from "core/property_mixins"

describe("property_mixins module", () => {

  describe("exports", () => {

    it("should have mixins", () => {
      expect("line" in mixins).to.be.true
      expect("fill" in mixins).to.be.true
      expect("text" in mixins).to.be.true
    })

    it("should have a create function", () => {
      expect("create" in mixins).to.be.true
    })
  })
})
