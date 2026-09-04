import {describe, expect, it, vi} from "vitest"

import {kernelProxy} from "../src/kernel"
import {MAX_PENDING_PATCHES} from "../src/revision_queue"

describe("JupyterLab kernel transport", () => {
  it("opens an application view with the browser-resolved URL", async () => {
    const comm: any = {
      open: vi.fn(),
      close: vi.fn(() => ({done: Promise.resolve()})),
    }
    const kernel = {createComm: vi.fn(() => comm)}
    const manager = {
      context: {sessionContext: {ready: Promise.resolve(), session: {kernel}}},
      applicationUrl: vi.fn(() => "https://hub.test/user/alice/proxy/4312/app/"),
    }
    const opening = kernelProxy(manager as any).openApplicationView!("view", "http://127.0.0.1:4312/app/")
    await Promise.resolve()
    expect(comm.open).toHaveBeenCalledWith({
      view_id: "view",
      application_url: "https://hub.test/user/alice/proxy/4312/app/",
    })
    comm.onMsg({content: {data: {kind: "ready", artifact: "{\"schema\":\"bokeh.embed/v1\"}"}}})
    await expect(opening).resolves.toMatchObject({artifactJson: "{\"schema\":\"bokeh.embed/v1\"}"})
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
