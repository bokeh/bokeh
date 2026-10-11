import {beforeEach, describe, expect, it, vi} from "vitest"

import {DisplayPayload, PROTOCOL_VERSION, ResourcePayload} from "../src/protocol"
import {currentDocumentSnapshot, loadResources, renderDisplay, resetResourceRegistry} from "../src/runtime"

const artifact = {
  schema: "bokeh.embed/v1",
  bokeh_version: "4.0.0",
  source: {kind: "standalone", documents: [{roots: []}]},
  roots: [
    {key: "first", document: 0, root: 0},
    {key: "second", document: 0, root: 1},
  ],
  requires: {components: ["bokeh/core"], extensions: []},
  metadata: {},
}
const display: DisplayPayload = {
  protocol_version: PROTOCOL_VERSION,
  kind: "artifact",
  resource_id: "resource",
  bokeh_version: "4.0.0",
  python_version: "4.0.0",
  source_kind: "standalone",
  view_id: "view",
  connect_timeout: 5000,
}
const resource: ResourcePayload = {
  protocol_version: PROTOCOL_VERSION,
  kind: "resources",
  resource_id: "resource",
  mode: "host-owned",
  bokeh_version: "4.0.0",
  python_version: "4.0.0",
  requirements: artifact.requires,
  policy: {mode: "none"},
  dependencies: [],
  artifacts: [],
  warnings: [],
  load_timeout: 5000,
}
const html = `<script type="application/vnd.bokeh.embed+json" data-bokeh-embed-payload>${JSON.stringify(artifact)}</script>`

describe("artifact runtime", () => {
  beforeEach(() => {
    resetResourceRegistry()
    document.body.replaceChildren()
  })

  it("mounts keyed caller-owned targets and disposes exactly once", async () => {
    const dispose = vi.fn(async () => undefined)
    const handle = {
      ready: Promise.resolve(),
      dispose,
      document: {to_json: () => ({roots: []}), roots: () => []},
      root_keys: [],
      root: () => null,
      view_lookup: {},
    }
    const mount = vi.fn(() => handle)
    ;(window as any).Bokeh = {
      version: "4.0.0",
      mount,
      when_mounted: vi.fn(async () => mount.mock.results[0].value),
      embed: {create_notebook_patch_receiver: vi.fn()},
    }
    const node = document.createElement("div")
    document.body.append(node)
    await loadResources(resource, "", node)

    const cleanup = await renderDisplay(node, display, html)
    expect(mount).toHaveBeenCalledOnce()
    const targets = mount.mock.calls[0][1] as Map<string, HTMLElement>
    expect([...targets.keys()]).toEqual(["first", "second"])
    expect(mount.mock.calls[0][2]).toMatchObject({resources: "none"})
    const snapshot = currentDocumentSnapshot(node, display)
    expect(snapshot?.view_id).toBe("view")
    const current = JSON.parse(snapshot?.artifact_json ?? "{}")
    expect(current.metadata.notebook_export).toEqual({view_id: "view"})
    cleanup()
    cleanup()
    expect(dispose).toHaveBeenCalledOnce()
    expect(node.querySelectorAll(".bk-embed-root")).toHaveLength(0)
  })

  it("uses the protocol's BokehJS version for Python development artifacts", async () => {
    const developmentArtifact = {...artifact, bokeh_version: "4.0.0.dev4+100.gabcdef"}
    const developmentHtml = `<script type="application/vnd.bokeh.embed+json" data-bokeh-embed-payload>${JSON.stringify(developmentArtifact)}</script>`
    const handle = {
      ready: Promise.resolve(),
      dispose: vi.fn(async () => undefined),
      document: {to_json: () => ({roots: []}), roots: () => []},
      root_keys: [],
      root: () => null,
      view_lookup: {},
    }
    ;(window as any).Bokeh = {
      version: "4.0.0",
      mount: vi.fn(() => handle),
      when_mounted: vi.fn(async () => handle),
      embed: {create_notebook_patch_receiver: vi.fn()},
    }
    const node = document.createElement("div")
    document.body.append(node)
    await loadResources(resource, "", node)

    const cleanup = await renderDisplay(node, {...display, python_version: developmentArtifact.bokeh_version}, developmentHtml)

    expect((window as any).Bokeh.mount).toHaveBeenCalledWith(
      developmentArtifact,
      expect.anything(),
      expect.objectContaining({resources: "none"}),
    )
    cleanup()
  })

  it("mounts the browser-routed artifact returned by the application owner", async () => {
    const localUrl = "http://127.0.0.1:4312/bokeh-notebook/nonce/"
    const browserUrl = "https://hub.test/user/alice/proxy/4312/bokeh-notebook/nonce/"
    const serverArtifact = {
      ...artifact,
      source: {kind: "server", url: localUrl, arguments: {}, headers: {}, credentials: "same-origin"},
      roots: [],
      metadata: {notebook_application_id: "application"},
    }
    const browserArtifact = {
      ...serverArtifact,
      source: {...serverArtifact.source, url: browserUrl},
    }
    const serverDisplay: DisplayPayload = {
      ...display,
      source_kind: "server",
      application_id: "application",
    }
    const serverHtml = `<script type="application/vnd.bokeh.embed+json" data-bokeh-embed-payload>${JSON.stringify(serverArtifact)}</script>`
    const handle = {
      ready: Promise.resolve(),
      dispose: vi.fn(async () => undefined),
      document: {to_json: () => ({roots: []}), roots: () => []},
      root_keys: [],
      root: () => null,
      view_lookup: {},
    }
    const mount = vi.fn(() => handle)
    ;(window as any).Bokeh = {
      version: "4.0.0",
      mount,
      when_mounted: vi.fn(async () => handle),
    }
    const openApplicationView = vi.fn(async () => ({
      artifactJson: JSON.stringify(browserArtifact),

      onClose() {},

      close() {},
    }))
    const node = document.createElement("div")
    document.body.append(node)
    await loadResources(resource, "", node)

    const cleanup = await renderDisplay(node, serverDisplay, serverHtml, {openApplicationView})

    expect(openApplicationView).toHaveBeenCalledWith("view")
    expect(mount).toHaveBeenCalledWith(browserArtifact, expect.anything(), expect.anything())
    cleanup()
  })

  it("cancels and disposes a mount before readiness", async () => {
    const dispose = vi.fn(async () => undefined)
    ;(window as any).Bokeh = {
      version: "4.0.0",
      mount: vi.fn(() => ({ready: new Promise(() => undefined), dispose, view_lookup: {}})),
      when_mounted: vi.fn(),
    }
    const node = document.createElement("div")
    document.body.append(node)
    await loadResources(resource, "", node)
    const controller = new AbortController()
    const rendering = renderDisplay(node, display, html, undefined, controller.signal)
    await Promise.resolve()
    await Promise.resolve()
    controller.abort()

    await expect(rendering).rejects.toMatchObject({name: "AbortError"})
    expect(dispose).toHaveBeenCalledOnce()
    expect(node.querySelectorAll(".bk-embed-root")).toHaveLength(0)
  })

  it("disposes failed mounts and removes every caller-owned root", async () => {
    const dispose = vi.fn(async () => undefined)
    ;(window as any).Bokeh = {
      version: "4.0.0",
      mount: vi.fn(() => ({ready: Promise.reject(new Error("decode failed")), dispose, view_lookup: {}})),
      when_mounted: vi.fn(),
    }
    const node = document.createElement("div")
    document.body.append(node)
    await loadResources(resource, "", node)

    await expect(renderDisplay(node, display, html)).rejects.toMatchObject({code: "ARTIFACT_RENDER_FAILED"})
    expect(dispose).toHaveBeenCalledOnce()
    expect(node.querySelectorAll(".bk-embed-root")).toHaveLength(0)
  })

  it("publishes a structured failure when mount creation fails before returning a handle", async () => {
    const publish = vi.fn()
    class MountError extends Error {}
    ;(window as any).Bokeh = {
      version: "4.0.0",
      mount: vi.fn(() => {throw new Error("synchronous source failure")}),
      when_mounted: vi.fn(),
      publish_mount_error: publish,
      MountError,
    }
    const node = document.createElement("div")
    document.body.append(node)
    await loadResources(resource, "", node)

    await expect(renderDisplay(node, display, html)).rejects.toMatchObject({code: "ARTIFACT_RENDER_FAILED"})
    expect(publish).toHaveBeenCalledTimes(2)
    expect(publish.mock.calls.every(([, error]) => error instanceof MountError)).toBe(true)
    expect(node.querySelectorAll(".bk-embed-root")).toHaveLength(0)
  })

  it("serializes concurrent resource registration and remounts a resync snapshot", async () => {
    const disposals: Array<ReturnType<typeof vi.fn>> = []
    const mount = vi.fn(() => {
      const dispose = vi.fn(async () => undefined)
      disposals.push(dispose)
      current = {
        ready: Promise.resolve(),
        dispose,
        document: {to_json: () => ({roots: []}), roots: () => []},
        root_keys: [],
        root: () => null,
        view_lookup: {},
      }
      return current
    })
    let current: any
    let receive: ((message: unknown, buffers: DataView[]) => void) | undefined
    const resync = vi.fn()
    ;(window as any).Bokeh = {
      version: "4.0.0",
      mount,
      when_mounted: vi.fn(async () => current),
      embed: {create_notebook_patch_receiver: vi.fn(() => vi.fn())},
    }
    const node = document.createElement("div")
    document.body.append(node)
    await Promise.all([loadResources(resource, "", node), loadResources(resource, "", node)])
    const liveDisplay = {...display, live_id: "live"}
    const cleanup = await renderDisplay(node, liveDisplay, html, {
      openLive: async () => ({
        artifactJson: JSON.stringify(artifact),
        resourceId: "resource",
        revision: 0,

        onMessage(callback) {receive = callback},

        onClose() {},
        requestResync: resync,

        close() {},
      }),
    })

    receive?.({kind: "snapshot", artifact: JSON.stringify(artifact), resource_id: "resource", revision: 3}, [])
    await vi.waitFor(() => {
      expect(mount).toHaveBeenCalledTimes(2)
      expect(disposals[0]).toHaveBeenCalledOnce()
    })
    expect(resync).not.toHaveBeenCalled()
    cleanup()
    expect(disposals[1]).toHaveBeenCalledOnce()
  })

  it("loads resources introduced by a live replacement snapshot", async () => {
    const handle = {
      ready: Promise.resolve(),
      dispose: vi.fn(async () => undefined),
      document: {to_json: () => ({roots: []}), roots: () => []},
      root_keys: [],
      root: () => null,
      view_lookup: {},
    }
    ;(window as any).Bokeh = {
      version: "4.0.0",
      mount: vi.fn(() => handle),
      when_mounted: vi.fn(async () => handle),
      embed: {create_notebook_patch_receiver: vi.fn(() => vi.fn())},
    }
    const dynamic = {...resource, resource_id: "dynamic"}
    const requestResource = vi.fn(async () => ({payload: dynamic, javascript: ""}))
    const node = document.createElement("div")
    document.body.append(node)
    await loadResources(resource, "", node)
    let receive: ((message: unknown, buffers: DataView[]) => void) | undefined

    const cleanup = await renderDisplay(node, {...display, live_id: "live"}, html, {
      requestResource,
      openLive: async () => ({
        artifactJson: JSON.stringify(artifact),
        resourceId: "resource",
        revision: 0,

        onMessage(callback) {receive = callback},

        onClose() {},

        requestResync() {},

        close() {},
      }),
    })

    expect(requestResource).not.toHaveBeenCalled()
    receive?.({kind: "snapshot", artifact: JSON.stringify(artifact), resource_id: "dynamic", revision: 1}, [])
    await vi.waitFor(() => {
      expect(requestResource).toHaveBeenCalledWith("dynamic")
      expect((window as any).Bokeh.mount).toHaveBeenCalledTimes(2)
    })
    cleanup()
  })

  it("stops resyncing after repeated replacement snapshots cannot mount", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    const initial = {
      ready: Promise.resolve(),
      dispose: vi.fn(async () => undefined),
      document: {to_json: () => ({roots: []}), roots: () => []},
      root_keys: [],
      root: () => null,
      view_lookup: {},
    }
    const failed = () => ({
      ready: Promise.reject(new Error("invalid replacement")),
      dispose: vi.fn(async () => undefined),
      view_lookup: {},
    })
    const mount = vi.fn()
      .mockReturnValueOnce(initial)
      .mockImplementation(failed)
    let receive: ((message: unknown, buffers: DataView[]) => void | Promise<void>) | undefined
    const resync = vi.fn()
    const close = vi.fn()
    ;(window as any).Bokeh = {
      version: "4.0.0",
      mount,
      when_mounted: vi.fn(async () => initial),
      embed: {create_notebook_patch_receiver: vi.fn(() => vi.fn())},
    }
    const node = document.createElement("div")
    document.body.append(node)
    await loadResources(resource, "", node)
    const cleanup = await renderDisplay(node, {...display, live_id: "live"}, html, {
      openLive: async () => ({
        artifactJson: JSON.stringify(artifact),
        resourceId: "resource",
        revision: 0,

        onMessage(callback) {receive = callback},

        onClose() {},
        requestResync: resync,
        close,
      }),
    })

    for (let revision = 1; revision <= 3; revision++) {
      await receive?.({kind: "snapshot", artifact: JSON.stringify(artifact), resource_id: "resource", revision}, [])
    }

    expect(resync).toHaveBeenCalledTimes(2)
    expect(close).toHaveBeenCalledOnce()
    expect(node.querySelector(".bk-notebook-disconnected")?.textContent).toContain("repeated Python snapshots")
    cleanup()
    warning.mockRestore()
  })

  it("executes the single resource owner embedded in HTML", async () => {
    const handle = {
      ready: Promise.resolve(),
      dispose: vi.fn(async () => undefined),
      document: {to_json: () => ({roots: []}), roots: () => []},
      root_keys: [],
      root: () => null,
      view_lookup: {},
    }
    ;(window as any).Bokeh = {
      version: "4.0.0",
      mount: vi.fn(() => handle),
      when_mounted: vi.fn(async () => handle),
    }
    const embedded = {...resource, resource_id: "embedded"}
    const script = "window.dispatchEvent(new CustomEvent('bokeh:resources-complete', {detail: {resource_id: 'embedded'}}))"
    const embeddedHtml = `<script data-bokeh-notebook-resource-record="embedded">${script}</script>${html}`
    const append = vi.spyOn(document.head, "append").mockImplementation((...nodes: (Node | string)[]) => {
      expect((nodes[0] as HTMLScriptElement).textContent).toBe(script)
      queueMicrotask(() => window.dispatchEvent(new CustomEvent("bokeh:resources-complete", {
        detail: {resource_id: "embedded"},
      })))
    })
    const node = document.createElement("div")
    document.body.append(node)

    const cleanup = await renderDisplay(node, {
      ...display,
      resource_id: "embedded",
      resource_records: [{payload: embedded}],
    }, embeddedHtml)

    expect(append).toHaveBeenCalledOnce()
    cleanup()
    append.mockRestore()
  })

  it("applies the declared CSP nonce to the executable resource wrapper", async () => {
    ;(window as any).Bokeh = {version: "4.0.0"}
    const append = vi.spyOn(document.head, "append").mockImplementation((...nodes: (Node | string)[]) => {
      const script = nodes[0] as HTMLScriptElement
      expect(script.nonce).toBe("notebook-nonce")
      queueMicrotask(() => window.dispatchEvent(new CustomEvent("bokeh:resources-complete", {
        detail: {resource_id: "nonced"},
      })))
    })
    const nonced = {...resource, resource_id: "nonced", policy: {mode: "inline", nonce: "notebook-nonce"}}

    try {
      await loadResources(nonced, "void 0", document.createElement("div"))
      expect(append).toHaveBeenCalledOnce()
    } finally {
      append.mockRestore()
    }
  })

  it("retains page-global loaded resources when one notebook kernel changes", async () => {
    ;(window as any).Bokeh = {version: "4.0.0"}
    const node = document.createElement("div")
    await loadResources(resource, "", node)

    resetResourceRegistry({notebook: "changed"})
    await expect(loadResources(resource, "", node)).resolves.toBeUndefined()
  })

  it("keeps the last mounted artifact visible and labels a closed live connection", async () => {
    const handle = {
      ready: Promise.resolve(),
      dispose: vi.fn(async () => undefined),
      document: {to_json: () => ({roots: []}), roots: () => []},
      root_keys: [],
      root: () => null,
      view_lookup: {},
    }
    let closed: (() => void) | undefined
    ;(window as any).Bokeh = {
      version: "4.0.0",
      mount: vi.fn(() => handle),
      when_mounted: vi.fn(async () => handle),
      embed: {create_notebook_patch_receiver: vi.fn(() => vi.fn())},
    }
    const node = document.createElement("div")
    document.body.append(node)
    await loadResources(resource, "", node)
    const cleanup = await renderDisplay(node, {...display, live_id: "live"}, html, {
      openLive: async () => ({
        artifactJson: JSON.stringify(artifact),
        resourceId: "resource",
        revision: 0,

        onMessage() {},

        onClose(callback) {closed = callback},

        requestResync() {},

        close() {},
      }),
    })

    closed?.()
    expect(node.querySelector(".bk-notebook-disconnected")?.textContent).toContain("connection closed")
    cleanup()
    expect(node.querySelector(".bk-notebook-disconnected")).toBeNull()
  })

  it("rejects self and cross resource-dependency cycles with diagnostics", async () => {
    const node = document.createElement("div")
    const self = {...resource, resource_id: "self", dependencies: ["self"]}
    await expect(loadResources(self, "", node)).rejects.toMatchObject({
      code: "RESOURCE_DEPENDENCY_CYCLE",
      cause: {cycle: ["self", "self"]},
    })

    resetResourceRegistry()
    const first = {...resource, resource_id: "first", dependencies: ["second"]}
    const second = {...resource, resource_id: "second", dependencies: ["first"]}
    await expect(loadResources(first, "", node, {
      requestResource: async (resourceId) => ({
        payload: resourceId === "second" ? second : first,
        javascript: "",
      }),
    })).rejects.toMatchObject({
      code: "RESOURCE_DEPENDENCY_CYCLE",
      cause: {cycle: ["first", "second", "first"]},
    })
  })

  it("does not reparent connected shadow-DOM output", async () => {
    const dispose = vi.fn(async () => undefined)
    const handle = {
      ready: Promise.resolve(),
      dispose,
      document: {to_json: () => ({roots: []}), roots: () => []},
      root_keys: [],
      root: () => null,
      view_lookup: {},
    }
    const host = document.createElement("div")
    const shadow = host.attachShadow({mode: "open"})
    const node = document.createElement("div")
    shadow.append(node)
    document.body.append(host)
    const mount = vi.fn(() => {
      expect(node.parentNode).toBe(shadow)
      return handle
    })
    ;(window as any).Bokeh = {
      version: "4.0.0",
      mount,
      when_mounted: vi.fn(async () => handle),
    }
    await loadResources(resource, "", node)

    const cleanup = await renderDisplay(node, display, html)
    expect(node.parentNode).toBe(shadow)
    cleanup()
    host.remove()
  })
})
