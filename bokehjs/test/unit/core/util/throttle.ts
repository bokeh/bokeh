import {expect} from "#framework/assertions"

import * as sinon from "sinon"

import {throttle} from "@bokehjs/core/util/throttle"

describe("core/util/throttle module", () => {

  it("should implement throttle() function", async () => {
    let i = 0

    const fn = throttle(() => i += 1, 20)
    await fn()

    expect(i).to.be.equal(1)
  })

  it("should allow throttle fn in throttle(fn)", async () => {
    let i = 0

    const fn = throttle(() => i += 1, 20)
    await Promise.all([fn(), fn(), fn()])

    expect(i).to.be.equal(1)
  })

  it("resolves a queued call when another call arrives after its timer is due", async () => {
    const clock = sinon.useFakeTimers({
      now: 100,
      toFake: ["Date", "setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"],
    })
    try {
      let calls = 0
      const fn = throttle(() => calls += 1, 20)
      const first = fn()
      await clock.tickAsync(16)
      await first

      let settled = false
      void fn().then(() => settled = true)
      // Advance the wall clock without running the queued timer, as on a busy event loop.
      clock.setSystemTime(200)
      const next = fn()
      await clock.tickAsync(50)

      expect(settled).to.be.true
      await next
      expect(calls).to.be.equal(2)
    } finally {
      clock.restore()
    }
  })

  it("should allow to stop throttle() function", async () => {
    let i = 0

    const fn = throttle(() => i += 1, 20)
    const promise = fn()
    fn.stop()
    await promise

    expect(i).to.be.equal(0)
  })
})
