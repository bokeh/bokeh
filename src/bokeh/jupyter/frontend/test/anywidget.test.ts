import {afterEach, beforeEach, describe, expect, it, vi} from "vitest"

import anywidgetFactory from "../src/anywidget"
import {MAX_PENDING_BYTES, MAX_PENDING_PATCHES} from "../src/revision_queue"

describe("AnyWidget transport", () => {
  beforeEach(() => vi.stubGlobal("crypto", {randomUUID: () => "frontend"}))
  afterEach(() => vi.unstubAllGlobals())

  it("does not publish a kernel-local application URL during initialization", () => {
    const sent: unknown[] = []
    const model = {
      get() {return undefined},

      on() {},

      off() {},

      send(data: unknown) {sent.push(data)},
    }
    const controller = new AbortController()
    anywidgetFactory().initialize({model, signal: controller.signal} as any)
    expect(sent).toEqual([])
    controller.abort()
    expect(sent).toEqual([{kind: "disposed", frontend_id: "frontend"}])
  })

  it("returns the browser-routed application URL only over the live transport", () => {
    let receive: ((data: unknown) => void) | undefined
    const sent: unknown[] = []
    const model = {
      get() {return undefined},

      on(name: string, callback: typeof receive) {if (name === "msg:custom") receive = callback},

      off() {},

      send(data: unknown) {sent.push(data)},
    }
    const controller = new AbortController()
    anywidgetFactory().initialize({model, signal: controller.signal} as any)
    receive?.({
      kind: "configure",
      frontend_id: "frontend",
      artifact: JSON.stringify({source: {kind: "server", url: "http://127.0.0.1:4321/app"}}),
    })

    expect(sent).toContainEqual({
      kind: "application_url",
      frontend_id: "frontend",
      application_url: "http://127.0.0.1:4321/app",
    })
    controller.abort()
  })

  it("bounds pre-render patch history and requests a revisioned snapshot", () => {
    let receive: ((data: unknown, buffers?: ArrayBufferView[]) => void) | undefined
    const sent: unknown[] = []
    const model = {
      get() {return undefined},

      on(name: string, callback: typeof receive) {if (name === "msg:custom") receive = callback},

      off() {},

      send(data: unknown) {sent.push(data)},
    }
    const controller = new AbortController()
    const factory = anywidgetFactory()
    factory.initialize({model, signal: controller.signal} as any)

    for (let revision = 1; revision <= MAX_PENDING_PATCHES + 1; revision++) {
      receive?.({kind: "patch", frontend_id: "frontend", revision, content: {events: []}})
    }

    expect(sent).toContainEqual({kind: "resync", frontend_id: "frontend"})
    controller.abort()
  })

  it("bounds detached binary buffers before a renderer subscribes", () => {
    let receive: ((data: unknown, buffers?: ArrayBufferView[]) => void) | undefined
    const sent: unknown[] = []
    const model = {
      get() {return undefined},

      on(name: string, callback: typeof receive) {if (name === "msg:custom") receive = callback},

      off() {},

      send(data: unknown) {sent.push(data)},
    }
    const controller = new AbortController()
    anywidgetFactory().initialize({model, signal: controller.signal} as any)

    receive?.({kind: "patch", frontend_id: "frontend", revision: 1, content: {events: []}}, [new Uint8Array(MAX_PENDING_BYTES + 1)])

    expect(sent).toContainEqual({kind: "resync", frontend_id: "frontend"})
    controller.abort()
  })

  it("requests only one resync while waiting for a replacement snapshot", () => {
    let receive: ((data: unknown, buffers?: ArrayBufferView[]) => void) | undefined
    const sent: unknown[] = []
    const model = {
      get() {return undefined},

      on(name: string, callback: typeof receive) {if (name === "msg:custom") receive = callback},

      off() {},

      send(data: unknown) {sent.push(data)},
    }
    const controller = new AbortController()
    anywidgetFactory().initialize({model, signal: controller.signal} as any)

    for (let revision = 1; revision <= MAX_PENDING_PATCHES + 20; revision++) {
      receive?.({kind: "patch", frontend_id: "frontend", revision, content: {events: []}})
    }

    expect(sent.filter((message: any) => message.kind === "resync")).toHaveLength(1)
    receive?.({kind: "snapshot", frontend_id: "frontend", revision: 100, artifact: "{}", resource_id: "resource"})
    for (let revision = 101; revision <= 101 + MAX_PENDING_PATCHES; revision++) {
      receive?.({kind: "patch", frontend_id: "frontend", revision, content: {events: []}})
    }
    expect(sent.filter((message: any) => message.kind === "resync")).toHaveLength(2)
    controller.abort()
  })

})
