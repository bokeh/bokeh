import {describe, expect, it} from "vitest"

import anywidgetFactory, {ANYWIDGET_MAX_PENDING_BYTES, ANYWIDGET_MAX_PENDING_PATCHES} from "../src/anywidget"

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

    for (let revision = 1; revision <= ANYWIDGET_MAX_PENDING_PATCHES + 1; revision++) {
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

    receive?.({kind: "patch", revision: 1, content: {events: []}}, [new Uint8Array(ANYWIDGET_MAX_PENDING_BYTES + 1)])

    expect(sent).toContainEqual({kind: "resync"})
    controller.abort()
  })
})
