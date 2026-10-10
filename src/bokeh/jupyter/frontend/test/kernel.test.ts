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
})
