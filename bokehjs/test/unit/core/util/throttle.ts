import {useFakeTimers} from "sinon"
import type {SinonFakeTimers} from "sinon"

import {expect} from "#framework/assertions"
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

  it("should allow to stop throttle() function", async () => {
    let i = 0

    const fn = throttle(() => i += 1, 20)
    const promise = fn()
    fn.stop()
    await promise

    expect(i).to.be.equal(0)
  })
})

// Advance wall time independently of the timer and animation frame queues.
describe("throttle scheduling", () => {
  async function with_clock(test: (clock: SinonFakeTimers) => Promise<void>) {
    const clock = useFakeTimers({now: 1000})
    try {
      await test(clock)
    } finally {
      clock.restore()
    }
  }

  it("should settle a delayed call when an overdue timer is canceled", async () => {
    await with_clock(async (clock) => {
      let runs = 0
      const fn = throttle(() => runs++, 20)
      const first = fn()
      clock.runToFrame()
      await first
      clock.tick(1)
      let settled = false
      void fn().then(() => settled = true)
      clock.setSystemTime(Date.now() + 20)
      const next = fn()
      clock.runToFrame()
      await next
      expect(settled).to.be.true
      expect(runs).to.be.equal(2)
      expect(clock.countTimers()).to.be.equal(0)
    })
  })

  it("should coalesce calls while a delayed animation frame is pending", async () => {
    await with_clock(async (clock) => {
      let runs = 0
      const fn = throttle(() => runs++, 20)
      const first = fn()
      clock.runToFrame()
      await first
      clock.tick(1)
      const delayed = fn()
      clock.tick(19)
      await fn()
      clock.runToFrame()
      await delayed
      expect(runs).to.be.equal(2)
      expect(clock.countTimers()).to.be.equal(0)
    })
  })

  for (const delayed of [false, true]) {
    it(`should stop ${delayed ? "delayed" : "frame"} work after coalesced calls and allow reuse`, async () => {
      await with_clock(async (clock) => {
        let runs = 0
        const fn = throttle(() => runs++, 20)
        if (delayed) {
          const first = fn()
          clock.runToFrame()
          await first
          clock.tick(1)
        }
        let settled = false
        void fn().then(() => settled = true)
        await fn()
        fn.stop()
        await Promise.resolve()
        expect(settled).to.be.true
        expect(clock.countTimers()).to.be.equal(0)
        const next = fn()
        clock.runAll()
        await next
        expect(runs).to.be.equal(delayed ? 2 : 1)
      })
    })
  }

  it("should allow stopping before a call and repeatedly", async () => {
    const fn = throttle(() => {}, 20)
    fn.stop()
    fn.stop()
  })

  it("should reject errors and preserve reentrant work", async () => {
    await with_clock(async (clock) => {
      const error = new Error("paint failed")
      let next: Promise<void> | undefined
      let runs = 0
      const fn = throttle(() => {
        if (++runs == 1) {
          next = fn()
          throw error
        }
      }, 20)
      const first = fn().catch((e: unknown) => e)
      clock.runToFrame()
      expect(await first).to.be.equal(error)
      clock.runAll()
      await next
      expect(runs).to.be.equal(2)
    })
  })
})
