import {describe, expect, it, vi} from "vitest"

import {kernelProxy} from "../src/kernel"
import {MAX_PENDING_PATCHES} from "../src/revision_queue"

describe("JupyterLab kernel transport", () => {
  it("opens an application view and resolves the returned artifact for the browser", async () => {
    const comm: any = {
      open: vi.fn(),
      send: vi.fn(),
      close: vi.fn(() => ({done: Promise.resolve()})),
    }
    const kernel = {createComm: vi.fn(() => comm)}
    const routed = "{\"schema\":\"bokeh.embed/v1\",\"source\":{\"url\":\"https://jupyter.example/proxy/4312/app\"},\"routed\":true}"
    const manager = {
      context: {sessionContext: {ready: Promise.resolve(), session: {kernel}}},
      applicationArtifact: vi.fn(async () => routed),
    }
    const opening = kernelProxy(manager as any).openApplicationView!("view")
    await Promise.resolve()
    expect(comm.open).toHaveBeenCalledWith({view_id: "view"})
    await comm.onMsg({content: {data: {kind: "configure", artifact: "{\"schema\":\"bokeh.embed/v1\"}"}}})
    expect(comm.send).toHaveBeenCalledWith({
      kind: "application_url",
      application_url: "https://jupyter.example/proxy/4312/app",
    })
    await comm.onMsg({content: {data: {kind: "ready", artifact: routed}}})
    await expect(opening).resolves.toMatchObject({artifactJson: routed})
    expect(manager.applicationArtifact).toHaveBeenCalledTimes(1)
  })

  it("does not block kernel message handling while resolving an application route", async () => {
    const comm: any = {
      open: vi.fn(),
      send: vi.fn(),
      close: vi.fn(() => ({done: Promise.resolve()})),
    }
    const kernel = {createComm: vi.fn(() => comm)}
    const manager = {
      context: {sessionContext: {ready: Promise.resolve(), session: {kernel}}},
      applicationArtifact: vi.fn(() => new Promise<string>(() => undefined)),
    }
    const opening = kernelProxy(manager as any).openApplicationView!("view")
    const closed = opening.then(() => false, () => true)
    await Promise.resolve()

    const result = comm.onMsg({
      content: {data: {kind: "configure", artifact: "{\"schema\":\"bokeh.embed/v1\"}"}},
    })

    expect(result).toBeUndefined()
    expect(comm.send).not.toHaveBeenCalled()
    comm.onClose()
    await expect(closed).resolves.toBe(true)
  })

  it("bounds pre-render patch history and requests one replacement snapshot", async () => {
    const comm: any = {
      open: vi.fn(),
      send: vi.fn(),
      close: vi.fn(() => ({done: Promise.resolve()})),
    }
    const kernel = {createComm: vi.fn(() => comm)}
    const manager = {
      context: {sessionContext: {ready: Promise.resolve(), session: {kernel}}},
    }
    const opening = kernelProxy(manager as any).openLive!("live")
    await Promise.resolve()
    comm.onMsg({content: {data: {kind: "snapshot", artifact: "{}", resource_id: "resource", revision: 0}}})
    const connection = await opening

    for (let revision = 1; revision <= MAX_PENDING_PATCHES + 20; revision++) {
      comm.onMsg({content: {data: {kind: "patch", revision, content: {events: []}}}})
    }
    expect(comm.send).toHaveBeenCalledTimes(1)
    expect(comm.send).toHaveBeenCalledWith({kind: "resync"})

    const received: any[] = []
    connection.onMessage((message) => received.push(message))
    comm.onMsg({content: {data: {kind: "patch", revision: 90, content: {events: []}}}})
    expect(received).toEqual([])

    comm.onMsg({content: {data: {kind: "snapshot", artifact: "{\"fresh\":true}", resource_id: "resource", revision: 100}}})
    await vi.waitFor(() => expect(received).toEqual([
      {kind: "snapshot", artifact: "{\"fresh\":true}", resource_id: "resource", revision: 100},
    ]))
    connection.close()
  })

  it("bounds patches while an attached consumer is still processing", async () => {
    const comm: any = {
      open: vi.fn(),
      send: vi.fn(),
      close: vi.fn(() => ({done: Promise.resolve()})),
    }
    const kernel = {createComm: vi.fn(() => comm)}
    const manager = {
      context: {sessionContext: {ready: Promise.resolve(), session: {kernel}}},
    }
    const opening = kernelProxy(manager as any).openLive!("live")
    await Promise.resolve()
    comm.onMsg({content: {data: {
      kind: "snapshot", artifact: "{}", resource_id: "resource", revision: 0,
    }}})
    const connection = await opening
    let release!: () => void
    const blocked = new Promise<void>((resolve) => {release = resolve})
    connection.onMessage(async () => blocked)

    for (let revision = 1; revision <= MAX_PENDING_PATCHES + 20; revision++) {
      comm.onMsg({content: {data: {kind: "patch", revision, content: {events: []}}}})
    }

    expect(comm.send).toHaveBeenCalledTimes(1)
    expect(comm.send).toHaveBeenCalledWith({kind: "resync"})
    release()
    connection.close()
  })

  it("opens a comm session for an application view and relays Bokeh protocol messages", async () => {
    const comm: any = {
      open: vi.fn(),
      send: vi.fn(),
      close: vi.fn(() => ({done: Promise.resolve()})),
    }
    const kernel = {createComm: vi.fn(() => comm)}
    const manager = {context: {sessionContext: {ready: Promise.resolve(), session: {kernel}}}}
    const opening = kernelProxy(manager as any).openApplicationSession!("view")
    await Promise.resolve()
    expect(comm.open).toHaveBeenCalledWith({view_id: "view", transport: "comms"})

    comm.onMsg({content: {data: {kind: "session", session_id: "session", resource_id: "resource"}}})
    const session = await opening
    expect(session).toMatchObject({sessionId: "session", resourceId: "resource"})

    const received = vi.fn()
    const closed = vi.fn()
    const onClose = vi.fn()
    session.channel.on_message = received
    session.channel.on_close = closed
    session.onClose(onClose)
    session.channel.open()
    expect(comm.send).toHaveBeenLastCalledWith({kind: "connect"})
    const buffer = new ArrayBuffer(4)
    session.channel.send("{\"envelope\":1}", [buffer])
    expect(comm.send).toHaveBeenLastCalledWith({kind: "bokeh", envelope: "{\"envelope\":1}"}, undefined, [buffer])

    comm.onMsg({content: {data: {kind: "bokeh", envelope: "{}"}}, buffers: [new Uint8Array([1, 2])]})
    expect(received).toHaveBeenCalledWith("{}", [expect.any(DataView)])

    comm.onMsg({content: {data: {kind: "error", code: "PROTOCOL_ERROR", message: "bad message"}}})
    comm.onClose()
    expect(closed).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledWith({text: "bad message", traceback: null})
  })

  it("rejects an application session with the kernel's error and traceback", async () => {
    const comm: any = {
      open: vi.fn(),
      send: vi.fn(),
      close: vi.fn(() => ({done: Promise.resolve()})),
    }
    const kernel = {createComm: vi.fn(() => comm)}
    const manager = {context: {sessionContext: {ready: Promise.resolve(), session: {kernel}}}}
    const opening = kernelProxy(manager as any).openApplicationSession!("view")
    await Promise.resolve()

    comm.onMsg({content: {data: {
      kind: "error",
      code: "APPLICATION_SESSION_FAILED",
      message: "ValueError: no data",
      traceback: "Traceback (most recent call last):\nValueError: no data",
    }}})

    const error = await opening.then(() => null, (error) => error)
    expect(error).toMatchObject({code: "APPLICATION_SESSION_FAILED"})
    expect(error.message).toContain("ValueError: no data")
    expect(error.cause.stack).toContain("Traceback (most recent call last)")
    expect(comm.close).toHaveBeenCalled()
  })

  it("closes an application session's comm when the page unloads", async () => {
    const comm: any = {
      open: vi.fn(),
      send: vi.fn(),
      close: vi.fn(() => ({done: Promise.resolve()})),
    }
    const kernel = {createComm: vi.fn(() => comm)}
    const manager = {context: {sessionContext: {ready: Promise.resolve(), session: {kernel}}}}
    const opening = kernelProxy(manager as any).openApplicationSession!("view")
    await Promise.resolve()
    comm.onMsg({content: {data: {kind: "session", session_id: "session", resource_id: "resource"}}})
    await opening

    // A page kept in the back/forward cache may come back, so its session stays open.
    window.dispatchEvent(Object.assign(new Event("pagehide"), {persisted: true}))
    expect(comm.close).not.toHaveBeenCalled()

    window.dispatchEvent(Object.assign(new Event("pagehide"), {persisted: false}))
    expect(comm.close).toHaveBeenCalledTimes(1)
    window.dispatchEvent(Object.assign(new Event("pagehide"), {persisted: false}))
    expect(comm.close).toHaveBeenCalledTimes(1)
  })
})
