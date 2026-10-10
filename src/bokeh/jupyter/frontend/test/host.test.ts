import {describe, expect, it} from "vitest"

import {jupyterServerBaseUrl, resolveJupyterApplicationArtifact, resolveJupyterApplicationUrl} from "../src/host"

describe("notebook host URL resolution", () => {
  it("maps a kernel-local application through a remote Jupyter base URL", () => {
    expect(resolveJupyterApplicationUrl(
      "http://127.0.0.1:4312/bokeh-notebook/nonce/",
      "/user/alice/",
      "https://hub.example.test/lab/tree/plot.ipynb",
    )).toBe("https://hub.example.test/user/alice/proxy/4312/bokeh-notebook/nonce/")
  })

  it("preserves direct local and explicitly configured application URLs", () => {
    const local = "http://127.0.0.1:4312/bokeh-notebook/nonce/"
    expect(resolveJupyterApplicationUrl(local, "/", "http://localhost:8888/lab")).toBe(local)
    const explicit = "https://apps.example.test/user/alice/proxy/4312/bokeh-notebook/nonce/"
    expect(resolveJupyterApplicationUrl(explicit, "/user/alice/", "https://hub.example.test/lab")).toBe(explicit)
  })

  it("rewrites only the transient application artifact", () => {
    const artifact = JSON.stringify({source: {kind: "server", url: "http://127.0.0.1:4312/app/"}})
    const routed = JSON.parse(resolveJupyterApplicationArtifact(
      artifact,
      "/user/alice/",
      "https://hub.example.test/lab/tree/plot.ipynb",
    ))

    expect(routed.source.url).toBe("https://hub.example.test/user/alice/proxy/4312/app/")
    expect(JSON.parse(artifact).source.url).toBe("http://127.0.0.1:4312/app/")
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
