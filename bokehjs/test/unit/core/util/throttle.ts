import {expect} from "assertions"
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
