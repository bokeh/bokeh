import {expect} from "#framework/assertions"
import {Signal} from "@bokehjs/core/signaling"

describe("core/signaling module", () => {
  describe("Signal", () => {
    it("should support `name` attribute", () => {
      const signal = new Signal(Object.create(null), "some")
      expect(signal.name).to.be.equal("some")
    })

    it("disconnects a receiver after one of its connections was already disconnected", () => {
      const first = new Signal<void, object>({}, "first")
      const last = new Signal<void, object>({}, "last")
      const receiver = {}
      let calls = 0
      const slot = () => calls++
      first.connect(slot, receiver)
      last.connect(slot, receiver)
      first.disconnect(slot, receiver)
      Signal.disconnect_receiver(receiver)
      last.emit()
      expect(calls).to.be.equal(0)
    })

    it("should support `{dis}connect()` method", () => {
      const signal = new Signal<number, object>(Object.create(null), "some")

      let signaled: number = 0
      const fn = (val: number) => signaled = val

      expect(signal.connect(fn)).to.be.true
      expect(signal.connect(fn)).to.be.false

      expect(signaled).to.be.equal(0)

      signal.emit(1)
      expect(signaled).to.be.equal(1)
      signal.emit(2)
      expect(signaled).to.be.equal(2)

      expect(signal.disconnect(fn)).to.be.true
      expect(signal.disconnect(fn)).to.be.false

      signal.emit(3)
      expect(signaled).to.be.equal(2)
    })
  })
})
