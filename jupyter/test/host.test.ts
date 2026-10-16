import {describe, expect, it, vi} from "vitest"

import {jupyterServerBaseUrl, resolveJupyterApplicationArtifact, resolveJupyterApplicationUrl} from "../src/host"

describe("notebook host URL resolution", () => {
  it("maps a kernel-local application through a remote Jupyter base URL", async () => {
    await expect(resolveJupyterApplicationUrl(
      "http://127.0.0.1:4312/bokeh-notebook/nonce/",
      "/user/alice/",
      "https://hub.example.test/lab/tree/plot.ipynb",
    )).resolves.toBe("https://hub.example.test/user/alice/proxy/4312/bokeh-notebook/nonce/")
  })

  it("uses an available Jupyter proxy when the page itself is local", async () => {
    const local = "http://127.0.0.1:4312/bokeh-notebook/nonce/"
    const request = vi.fn(async () => ({ok: true})) as any
    await expect(resolveJupyterApplicationUrl(local, "/", "http://localhost:8888/lab", request))
      .resolves.toBe("http://localhost:8888/proxy/4312/bokeh-notebook/nonce/")
    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0][0]).toBe(
      "http://localhost:8888/proxy/4312/bokeh-notebook/nonce/static/js/bokeh.min.js",
    )
  })

  it("uses the direct application URL when a local Jupyter proxy is unavailable", async () => {
    const local = "http://127.0.0.1:4313/bokeh-notebook/nonce/"
    const request = vi.fn(async () => ({ok: false, status: 404})) as any
    await expect(resolveJupyterApplicationUrl(local, "/", "http://localhost:8888/lab", request))
      .resolves.toBe(local)
  })

  it("bounds a stalled local Jupyter proxy probe", async () => {
    vi.useFakeTimers()
    try {
      const local = "http://127.0.0.1:4399/bokeh-notebook/nonce/"
      const request = vi.fn((_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
        options.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), {once: true})
      })) as any
      const resolving = resolveJupyterApplicationUrl(local, "/", "http://localhost:8888/lab", request)

      await vi.advanceTimersByTimeAsync(2_000)

      await expect(resolving).resolves.toBe(local)
      expect(request).toHaveBeenCalledTimes(1)
      expect(request.mock.calls[0][1].signal.aborted).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it("does not proxy an application URL that is already same-origin", async () => {
    const routed = "http://localhost:8888/proxy/4312/bokeh-notebook/nonce/"
    const request = vi.fn()
    await expect(resolveJupyterApplicationUrl(routed, "/", "http://localhost:8888/lab", request as any))
      .resolves.toBe(routed)
    expect(request).not.toHaveBeenCalled()
  })

  it("preserves explicitly configured application URLs", async () => {
    const explicit = "https://apps.example.test/user/alice/proxy/4312/bokeh-notebook/nonce/"
    await expect(resolveJupyterApplicationUrl(explicit, "/user/alice/", "https://hub.example.test/lab"))
      .resolves.toBe(explicit)
  })

  it("rewrites only the transient application artifact", async () => {
    const artifact = JSON.stringify({source: {kind: "server", url: "http://127.0.0.1:4312/app/"}})
    const routed = JSON.parse(await resolveJupyterApplicationArtifact(
      artifact,
      "/user/alice/",
      "https://hub.example.test/lab/tree/plot.ipynb",
    ))

    expect(routed.source.url).toBe("https://hub.example.test/user/alice/proxy/4312/app/")
    expect(JSON.parse(artifact).source.url).toBe("http://127.0.0.1:4312/app/")
  })

  it("preserves an application artifact with an explicitly configured route", async () => {
    const artifact = JSON.stringify({
      source: {kind: "server", url: "http://127.0.0.1:4312/app/"},
      metadata: {notebook_application_proxy: false},
    })
    const request = vi.fn()

    await expect(resolveJupyterApplicationArtifact(
      artifact,
      "/",
      "http://localhost:8888/lab",
      request as any,
    )).resolves.toBe(artifact)
    expect(request).not.toHaveBeenCalled()
  })

  it("reads the base URL from Jupyter's page configuration", () => {
    const root = document.implementation.createHTMLDocument()
    const config = root.createElement("script")
    config.id = "jupyter-config-data"
    config.type = "application/json"
    config.textContent = JSON.stringify({baseUrl: "/user/alice/"})
    root.head.append(config)
    expect(jupyterServerBaseUrl(root)).toBe("/user/alice/")

    config.remove()
    root.body.dataset.baseUrl = encodeURIComponent("/services/notebooks/")
    expect(jupyterServerBaseUrl(root)).toBe("/services/notebooks/")
  })
})
