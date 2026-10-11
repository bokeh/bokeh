import {IRenderMime} from "@jupyterlab/rendermime-interfaces"
import {describe, expect, it, vi} from "vitest"

import {ContextManager} from "../src/context"
import {PROTOCOL_VERSION, DISPLAY_MIME_TYPE} from "../src/protocol"
import {DisplayRenderer} from "../src/renderers"

describe("display renderer", () => {
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
})
