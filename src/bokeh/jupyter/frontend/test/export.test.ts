import {ServerConnection} from "@jupyterlab/services"
import {afterEach, describe, expect, it, vi} from "vitest"

import {installExportInterceptor} from "../src/export"

describe("notebook export", () => {
  afterEach(() => vi.restoreAllMocks())

  it("opens the export tab before awaiting snapshot publication", async () => {
    let publish!: (response: Response) => void
    vi.spyOn(ServerConnection, "makeRequest").mockImplementation(() => new Promise((resolve) => {
      publish = resolve
    }))
    const replace = vi.fn()
    const popup = {opener: window, location: {replace}, close: vi.fn()}
    const open = vi.spyOn(window, "open").mockReturnValue(popup as any)
    const original = vi.fn()
    const manager = {
      exportAs: original,
      serverSettings: {baseUrl: "http://example.test/"},
    }
    installExportInterceptor({serviceManager: {nbconvert: manager}} as any, {
      snapshots: () => [{view_id: "view", artifact_json: "{}"}],
    } as any)

    const exporting = manager.exportAs({format: "html", path: "plot.ipynb"} as any)
    expect(open).toHaveBeenCalledOnce()
    expect(replace).not.toHaveBeenCalled()

    publish(new Response(null, {status: 204}))
    await exporting
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("bokeh-notebook/export/html/plot.ipynb"))
    expect(original).not.toHaveBeenCalled()
  })

  it("falls back to same-page navigation when the browser blocks the export popup", async () => {
    vi.spyOn(ServerConnection, "makeRequest").mockResolvedValue(new Response(null, {status: 204}))
    vi.spyOn(window, "open").mockReturnValue(null)
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined)
    const manager = {
      exportAs: vi.fn(),
      serverSettings: {baseUrl: "http://example.test/"},
    }
    installExportInterceptor({serviceManager: {nbconvert: manager}} as any, {
      snapshots: () => [],
    } as any)

    await manager.exportAs({format: "html", path: "plot.ipynb"} as any)

    expect(click).toHaveBeenCalledOnce()
    const link = click.mock.instances[0]
    expect(link.href).toContain("bokeh-notebook/export/html/plot.ipynb")
    expect(link.target).toBe("_self")
  })
})
