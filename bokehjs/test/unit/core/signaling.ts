import {expect} from "chai"
import {Signal} from "@bokehjs/core/signaling"

describe("core/signaling module", () => {
  describe("Signal", () => {
    it("should support `name` attribute", () => {
      const signal = new Signal(Object.create(null), "some")
      expect(signal.name).to.be.equal("some")
    })

    it("should support `{dis}connect()` method", () => {
      class Obj {}
      const signal = new Signal<Obj, [number, string, number[]]>(new Obj(), "some")

      let signaled: [number, string, number[], Obj?] | null = null

      const fn0 = (val0: number, val1: string, val2: number[]) => {
        signaled = [val0, val1, val2]
      }

      expect(signal.connect(fn0)).to.be.equal(true)
      expect(signal.connect(fn0)).to.be.equal(false)

      expect(signaled).to.be.equal(null)

      signal.emit(1, "a", [0, 1])
      expect(signaled).to.be.deep.equal([1, "a", [0, 1]])
      signal.emit(2, "b", [1, 2])
      expect(signaled).to.be.deep.equal([2, "b", [1, 2]])

      expect(signal.disconnect(fn0)).to.be.equal(true)
      expect(signal.disconnect(fn0)).to.be.equal(false)

      signal.emit(3, "c", [2, 3])
      expect(signaled).to.be.deep.equal([2, "b", [1, 2]])
    })
  })
})
