import {IRenderMime} from "@jupyterlab/rendermime-interfaces"
import {afterEach, describe, expect, it, vi} from "vitest"

import {ContextManager} from "../src/context"
import {PROTOCOL_VERSION, DISPLAY_MIME_TYPE} from "../src/protocol"
import {DisplayRenderer} from "../src/renderers"

describe("display renderer", () => {
  afterEach(() => {
    delete (window as any).Bokeh
  })

  it("uses portable HTML with a reduced-capability notice after a protocol mismatch", async () => {
    const manager = {
      add: vi.fn(),
      remove: vi.fn(),
    } as unknown as ContextManager
    const options = {
      mimeType: DISPLAY_MIME_TYPE,
      sanitizer: {sanitize: vi.fn((value: string) => value)},
      resolver: null,
      linkHandler: null,
      latexTypesetter: null,
    } as unknown as IRenderMime.IRendererOptions
    const renderer = new DisplayRenderer(options, manager)
    const model = {
      trusted: true,
      data: {
        [DISPLAY_MIME_TYPE]: {
          protocol_version: PROTOCOL_VERSION + 1,
          kind: "artifact",
          resource_id: "resource",
          bokeh_version: "4.1.0",
          python_version: "4.1.0",
          source_kind: "standalone",
          view_id: "view",
          connect_timeout: 5000,
        },
        "text/html": '<div data-portable-bokeh="">portable output</div>',
      },
      metadata: {},
      setData: vi.fn(),
    } as unknown as IRenderMime.IMimeModel

    await renderer.renderModel(model)

    expect(renderer.node.querySelector("[data-portable-bokeh]")?.textContent).toBe("portable output")
    expect(renderer.node.querySelector(".bk-notebook-protocol-fallback")?.textContent).toContain(
      `protocol ${PROTOCOL_VERSION + 1}`,
    )
    expect(renderer.node.textContent).toContain("Python-side Bokeh is newer")
    expect(renderer.node.textContent).toContain("without Python-connected updates")
    expect(renderer.node.querySelector(".bk-notebook-diagnostic")).toBeNull()
    renderer.dispose()
  })

  it("does not add a stale fallback notice after a newer render starts", async () => {
    let resolveUrl!: (url: string) => void
    const resolved = new Promise<string>((resolve) => resolveUrl = resolve)
    const resolver = {
      resolveUrl: vi.fn(() => resolved),
      getDownloadUrl: vi.fn(async (url: string) => url),
      isLocal: vi.fn(() => true),
    }
    const manager = {
      add: vi.fn(),
      remove: vi.fn(),
    } as unknown as ContextManager
    const options = {
      mimeType: DISPLAY_MIME_TYPE,
      sanitizer: {sanitize: vi.fn((value: string) => value)},
      resolver,
      linkHandler: null,
      latexTypesetter: null,
    } as unknown as IRenderMime.IRendererOptions
    const renderer = new DisplayRenderer(options, manager)
    const payload = {
      protocol_version: PROTOCOL_VERSION + 1,
      kind: "artifact",
      resource_id: "resource",
      bokeh_version: "4.1.0",
      python_version: "4.1.0",
      source_kind: "standalone",
      view_id: "view",
      connect_timeout: 5000,
    }
    const model = {
      trusted: true,
      data: {
        [DISPLAY_MIME_TYPE]: payload,
        "text/html": '<img src="image.png">',
      },
      metadata: {},
      setData: vi.fn(),
    } as unknown as IRenderMime.IMimeModel

    const first = renderer.renderModel(model)
    await vi.waitFor(() => expect(resolver.resolveUrl).toHaveBeenCalled())
    await renderer.renderModel({
      ...model,
      data: {[DISPLAY_MIME_TYPE]: payload, "text/html": ""},
    } as unknown as IRenderMime.IMimeModel)
    resolveUrl("image.png")
    await first

    expect(renderer.node.querySelector(".bk-notebook-protocol-fallback")).toBeNull()
    expect(renderer.node.querySelector(".bk-notebook-diagnostic")).not.toBeNull()
    renderer.dispose()
  })

  it("does not execute a saved fallback for another active BokehJS version", async () => {
    ;(window as any).Bokeh = {version: "4.0.0"}
    const manager = {
      add: vi.fn(),
      remove: vi.fn(),
    } as unknown as ContextManager
    const options = {
      mimeType: DISPLAY_MIME_TYPE,
      sanitizer: {sanitize: vi.fn((value: string) => value)},
      resolver: null,
      linkHandler: null,
      latexTypesetter: null,
    } as unknown as IRenderMime.IRendererOptions
    const renderer = new DisplayRenderer(options, manager)
    const model = {
      trusted: true,
      data: {
        [DISPLAY_MIME_TYPE]: {
          protocol_version: PROTOCOL_VERSION + 1,
          kind: "artifact",
          resource_id: "resource",
          bokeh_version: "3.9.0",
          python_version: "3.9.0",
          source_kind: "standalone",
          view_id: "view",
          connect_timeout: 5000,
        },
        "text/html": '<script>window.savedFallbackRan = true</script>',
      },
      metadata: {},
      setData: vi.fn(),
    } as unknown as IRenderMime.IMimeModel

    await renderer.renderModel(model)

    expect((window as any).savedFallbackRan).toBeUndefined()
    expect(renderer.node.textContent).toContain("BOKEH_VERSION_CONFLICT")
    expect(renderer.node.textContent).toContain("clear saved outputs")
    renderer.dispose()
  })
})
