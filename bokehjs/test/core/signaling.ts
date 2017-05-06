import {expect} from "chai"
import {Signal} from "core/signaling"

describe("core/signaling module", () => {
  describe("Signal", () => {
    it("should support `name` attribute", () => {
      const signal = new Signal(Object.create(null), "some")
      expect(signal.name).to.be.equal("some")
    })
  })
})
