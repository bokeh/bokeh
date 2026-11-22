import {expect} from "#framework/assertions"

import {delay} from "@bokehjs/core/util/defer"
import {SyncPolicyQueue} from "@bokehjs/core/util/sync_policy"

describe("core/util/sync_policy module", () => {
  it("should distinguish whole compound-key segments", async () => {
    const delivered: string[] = []
    const queue = new SyncPolicyQueue<string>((value) => delivered.push(value))

    queue.submit(["value", "debounce", 100], ["debounce", 100], "long", false)
    queue.submit(["value", "debounce", 10], ["debounce", 10], "short", false)

    await delay(30)
    expect(delivered).to.be.equal(["short"])

    await delay(100)
    expect(delivered).to.be.equal(["short", "long"])
  })

  it("should flush only keys matching a compound-key prefix", () => {
    const delivered: string[] = []
    const queue = new SyncPolicyQueue<string>((value) => delivered.push(value))

    queue.submit(["value", 1], ["committed", null], "one", true)
    queue.submit(["value", 10], ["committed", null], "ten", true)

    queue.flush(["value", 1])
    expect(delivered).to.be.equal(["one"])

    queue.flush(["value"])
    expect(delivered).to.be.equal(["one", "ten"])
  })
})
