import {afterEach, describe, expect, it, vi} from "vitest"

import {MAX_PENDING_BYTES, RevisionQueue} from "../src/revision_queue"
import {LiveRevisionTransport} from "../src/transport"

describe("revision queue", () => {
  afterEach(() => vi.useRealTimers())

  it("requests a snapshot for revision gaps and ignores replays while waiting", () => {
    const queue = new RevisionQueue()
    queue.reset(0)

    expect(queue.pushPatch({kind: "patch", revision: 1}, [])).toBe("queued")
    expect(queue.pushPatch({kind: "patch", revision: 3}, [])).toBe("overflow")
    expect(queue.awaitingResync).toBe(true)
    expect(queue.pushPatch({kind: "patch", revision: 2}, [])).toBe("ignored")
  })

  it("does not overflow one large patch that an idle consumer accepts immediately", () => {
    const queue = new RevisionQueue()
    const received: number[] = []
    queue.reset(0)
    queue.subscribe((message) => {received.push(message.revision)})

    const result = queue.pushPatch(
      {kind: "patch", revision: 1},
      [new DataView(new ArrayBuffer(MAX_PENDING_BYTES + 1))],
    )

    expect(result).toBe("queued")
    expect(received).toEqual([1])
    expect(queue.awaitingResync).toBe(false)
  })

  it("closes a transport after three unanswered resync requests", async () => {
    vi.useFakeTimers()
    const send = vi.fn()
    const failed = vi.fn()
    const transport = new LiveRevisionTransport(send, failed)

    transport.reset(0)
    transport.receive({kind: "patch", revision: 2})
    await vi.advanceTimersByTimeAsync(15_000)

    expect(send).toHaveBeenCalledTimes(3)
    expect(failed).toHaveBeenCalledOnce()
    transport.clear()
  })
})
