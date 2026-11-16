import {afterEach, beforeEach, describe, expect, it, vi} from "vitest"

const runtime = vi.hoisted(() => ({
  currentDocumentSnapshot: vi.fn(() => undefined),
  renderDiagnostic: vi.fn(),
  renderDisplay: vi.fn(async () => vi.fn()),
  renderLoading: vi.fn(() => vi.fn()),
}))

vi.mock("../src/runtime", () => runtime)

import anywidgetFactory from "../src/anywidget"
import {PROTOCOL_VERSION} from "../src/protocol"

function harness() {
  const listeners = new Set<(data: any, buffers?: ArrayBufferView[]) => void | Promise<void>>()
  const sent: any[] = []
  const payload = {
    protocol_version: PROTOCOL_VERSION,
    kind: "artifact",
    resource_id: "resource",
    bokeh_version: "4.0.0",
    python_version: "4.0.0",
    source_kind: "standalone",
    view_id: "view",
    connect_timeout: 5000,
  }
  const model = {
    get(name: string) {return name === "payload" ? payload : ""},

    on(name: string, callback: (data: any, buffers?: ArrayBufferView[]) => void | Promise<void>) {
      if (name === "msg:custom") listeners.add(callback)
    },

    off(name: string, callback: (data: any, buffers?: ArrayBufferView[]) => void | Promise<void>) {
      if (name === "msg:custom") listeners.delete(callback)
    },

    send(data: any, _callbacks?: unknown, buffers?: ArrayBufferView[]) {
      sent.push(buffers == null ? data : {...data, buffers})
    },
  }
  const receive = async (data: any, buffers?: ArrayBufferView[]) =>
    await Promise.all([...listeners].map(async (listener) => await listener(data, buffers)))
  return {model, receive, sent}
}

describe("AnyWidget transport", () => {
  let sequence = 0

  beforeEach(() => {
    sequence = 0
    runtime.renderDiagnostic.mockClear()
    runtime.renderDisplay.mockClear()
    runtime.renderLoading.mockClear()
    vi.stubGlobal("crypto", {randomUUID: () => `frontend-${++sequence}`})
  })

  afterEach(() => vi.unstubAllGlobals())

  it("owns one independent transport for every rendered view", async () => {
    const {model, receive, sent} = harness()
    const factory = anywidgetFactory()
    const first = new AbortController()
    const second = new AbortController()
    const cleanupFirst = await factory.render({model, el: document.createElement("div"), signal: first.signal} as any)
    const cleanupSecond = await factory.render({model, el: document.createElement("div"), signal: second.signal} as any)

    expect(sent.filter(({kind}) => kind === "active")).toEqual([
      {kind: "active", frontend_id: "frontend-1"},
      {kind: "active", frontend_id: "frontend-2"},
    ])

    await receive({
      kind: "configure",
      frontend_id: "frontend-1",
      artifact: JSON.stringify({source: {kind: "server", url: "http://127.0.0.1:4321/app"}}),
    })
    expect(sent).toContainEqual({
      kind: "application_url",
      frontend_id: "frontend-1",
      application_url: "http://127.0.0.1:4321/app",
    })
    expect(sent).not.toContainEqual(expect.objectContaining({kind: "application_url", frontend_id: "frontend-2"}))

    await receive({kind: "close", frontend_id: "frontend-1"})
    cleanupFirst?.()
    expect(sent.filter(({kind, frontend_id}) => kind === "inactive" && frontend_id === "frontend-1"))
      .toEqual([{kind: "inactive", frontend_id: "frontend-1"}])
    expect(sent).not.toContainEqual({kind: "inactive", frontend_id: "frontend-2"})
    first.abort()
    expect(sent.filter(({kind, frontend_id}) => kind === "disposed" && frontend_id === "frontend-1"))
      .toEqual([{kind: "disposed", frontend_id: "frontend-1"}])
    cleanupSecond?.()
  })

  it("releases only the aborted rendered view", async () => {
    const {model, sent} = harness()
    const controller = new AbortController()
    await anywidgetFactory().render({model, el: document.createElement("div"), signal: controller.signal} as any)

    controller.abort()

    expect(sent).toContainEqual({kind: "disposed", frontend_id: "frontend-1"})
  })

  it("preserves a render failure diagnostic until the host disposes the view", async () => {
    runtime.renderDisplay.mockRejectedValueOnce(new Error("render failed"))
    const {model, sent} = harness()
    const controller = new AbortController()

    await anywidgetFactory().render({
      model,
      el: document.createElement("div"),
      signal: controller.signal,
    } as any)

    expect(sent).toContainEqual({kind: "inactive", frontend_id: "frontend-1"})
    expect(sent).not.toContainEqual({kind: "disposed", frontend_id: "frontend-1"})
    expect(runtime.renderDiagnostic).toHaveBeenCalledOnce()

    controller.abort()
    expect(sent).toContainEqual({kind: "disposed", frontend_id: "frontend-1"})
  })

  it("sends local patches of an interactive view with its frontend identity", async () => {
    const {model, receive, sent} = harness()
    const controller = new AbortController()
    let live: any
    runtime.renderDisplay.mockImplementationOnce(async (_el: unknown, _payload: unknown, _html: unknown, kernel: any) => {
      live = await kernel.openLive("live")
      return vi.fn()
    })
    const rendering = anywidgetFactory().render({model, el: document.createElement("div"), signal: controller.signal} as any)
    await vi.waitFor(() => expect(sent).toContainEqual({kind: "active", frontend_id: "frontend-1"}))
    await receive({
      kind: "snapshot", frontend_id: "frontend-1", artifact: "{}", resource_id: "resource", revision: 0, interactive: true,
    })
    await rendering

    expect(live.interactive).toBe(true)
    const buffer = new Uint8Array([1, 2]).buffer
    live.send({kind: "patch", revision: 0, content: {events: []}, buffer_ids: ["0"]}, [buffer])
    const [message] = sent.filter(({kind}) => kind === "patch")
    expect(message).toMatchObject({kind: "patch", revision: 0, frontend_id: "frontend-1", buffer_ids: ["0"]})
    expect([...new Uint8Array(message.buffers[0].buffer)]).toEqual([1, 2])
    controller.abort()
  })
})
