import {beforeEach, describe, expect, it, vi} from "vitest"

import {DisplayPayload, PROTOCOL_VERSION, ResourcePayload} from "../src/protocol"
import {loadResources, renderDisplay, resetResourceRegistry} from "../src/runtime"

const artifact = {
  schema: "bokeh.embed/v1",
  bokeh_version: "4.0.0",
  fingerprint: "fingerprint",
  source: {kind: "standalone", documents: [{roots: []}]},
  roots: [
    {key: "first", document: 0, root: 0},
    {key: "second", document: 0, root: 1},
  ],
  requires: {components: ["bokeh/core"], extensions: []},
  metadata: {},
  buffers: [],
}
const display: DisplayPayload = {
  protocol_version: PROTOCOL_VERSION,
  kind: "artifact",
  resource_id: "resource",
  bokeh_version: "4.0.0",
  python_version: "4.0.0",
  artifact_fingerprint: artifact.fingerprint,
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
const html = `<script type="application/vnd.bokeh.embed+json" data-bokeh-artifact-payload>${JSON.stringify(artifact)}</script>`

describe("artifact runtime", () => {
  beforeEach(() => {
    resetResourceRegistry()
    document.body.replaceChildren()
  })

  it("mounts keyed caller-owned targets and disposes exactly once", async () => {
    const dispose = vi.fn(async () => undefined)
    const mount = vi.fn((_artifact: unknown, options: any) => ({
      ready: Promise.resolve(),
      dispose,
      document: {to_json: () => ({roots: []}), roots: () => []},
      root_keys: [],
      root: () => null,
      options,
    }))
    ;(window as any).Bokeh = {version: "4.0.0", mount, embed: {create_notebook_patch_receiver: vi.fn()}}
    const node = document.createElement("div")
    document.body.append(node)
    await loadResources(resource, "", node)

    const cleanup = await renderDisplay(node, display, html)
    expect(mount).toHaveBeenCalledOnce()
    const options = mount.mock.calls[0][1]
    expect([...options.targets.keys()]).toEqual(["first", "second"])
    cleanup()
    cleanup()
    expect(dispose).toHaveBeenCalledOnce()
    expect(node.querySelectorAll(".bk-embed-root")).toHaveLength(0)
  })

  it("cancels and disposes a mount before readiness", async () => {
    const dispose = vi.fn(async () => undefined)
    ;(window as any).Bokeh = {
      version: "4.0.0",
      mount: vi.fn(() => ({ready: new Promise(() => undefined), dispose})),
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
      mount: vi.fn(() => ({ready: Promise.reject(new Error("decode failed")), dispose})),
    }
    const node = document.createElement("div")
    document.body.append(node)
    await loadResources(resource, "", node)

    await expect(renderDisplay(node, display, html)).rejects.toMatchObject({code: "ARTIFACT_RENDER_FAILED"})
    expect(dispose).toHaveBeenCalledOnce()
    expect(node.querySelectorAll(".bk-embed-root")).toHaveLength(0)
  })

  it("serializes concurrent resource registration and remounts a resync snapshot", async () => {
    const disposals: Array<ReturnType<typeof vi.fn>> = []
    const mount = vi.fn(() => {
      const dispose = vi.fn(async () => undefined)
      disposals.push(dispose)
      return {
        ready: Promise.resolve(),
        dispose,
        document: {to_json: () => ({roots: []}), roots: () => []},
        root_keys: [],
        root: () => null,
      }
    })
    let receive: ((message: unknown, buffers: DataView[]) => void) | undefined
    const resync = vi.fn()
    ;(window as any).Bokeh = {
      version: "4.0.0",
      mount,
      embed: {create_notebook_patch_receiver: vi.fn(() => vi.fn())},
    }
    const node = document.createElement("div")
    document.body.append(node)
    await Promise.all([loadResources(resource, "", node), loadResources(resource, "", node)])
    const liveDisplay = {...display, live_id: "live"}
    const cleanup = await renderDisplay(node, liveDisplay, html, {
      openLive: async () => ({
        artifactJson: JSON.stringify(artifact),
        revision: 0,
        onMessage(callback) {receive = callback},
        requestResync: resync,
        close() {},
      }),
    })

    receive?.({kind: "snapshot", artifact: JSON.stringify(artifact), revision: 3}, [])
    await vi.waitFor(() => {
      expect(mount).toHaveBeenCalledTimes(2)
      expect(disposals[0]).toHaveBeenCalledOnce()
    })
    expect(resync).not.toHaveBeenCalled()
    cleanup()
    expect(disposals[1]).toHaveBeenCalledOnce()
  })
})
