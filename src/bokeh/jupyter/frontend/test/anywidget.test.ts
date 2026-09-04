import {describe, expect, it} from "vitest"

import anywidgetFactory from "../src/anywidget"
import {MAX_PENDING_BYTES, MAX_PENDING_PATCHES} from "../src/revision_queue"

describe("AnyWidget transport", () => {
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
      receive?.({kind: "patch", revision, content: {events: []}})
    }

    expect(sent).toContainEqual({kind: "resync"})
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

    receive?.({kind: "patch", revision: 1, content: {events: []}}, [new Uint8Array(MAX_PENDING_BYTES + 1)])

    expect(sent).toContainEqual({kind: "resync"})
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
      receive?.({kind: "patch", revision, content: {events: []}})
    }

    expect(sent.filter((message: any) => message.kind === "resync")).toHaveLength(1)
    receive?.({kind: "snapshot", revision: 100, artifact: "{}", resource_id: "resource"})
    for (let revision = 101; revision <= 101 + MAX_PENDING_PATCHES; revision++) {
      receive?.({kind: "patch", revision, content: {events: []}})
    }
    expect(sent.filter((message: any) => message.kind === "resync")).toHaveLength(2)
    controller.abort()
  })

})
