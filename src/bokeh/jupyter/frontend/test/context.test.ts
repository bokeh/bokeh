import {describe, expect, it} from "vitest"

import {ContextManager} from "../src/context"

describe("notebook context ownership", () => {
  it("collects AnyWidget snapshots only for views owned by this notebook", () => {
    const manager = new ContextManager({path: "one.ipynb"} as any, {} as any)
    manager.setOwnedViews(new Set(["owned"]))

    const collect = (event: Event) => {
      const snapshots = (event as CustomEvent).detail.snapshots
      snapshots.push({view_id: "owned", artifact_json: "{}"})
      snapshots.push({view_id: "other", artifact_json: "{}"})
    }
    window.addEventListener("bokeh:notebook-export-snapshots", collect)
    try {
      expect(manager.snapshots()).toEqual([{view_id: "owned", artifact_json: "{}"}])
    } finally {
      window.removeEventListener("bokeh:notebook-export-snapshots", collect)
      manager.dispose()
    }
  })

  it("resolves only safe notebook-relative file links", async () => {
    const getDownloadUrl = (path: string) => Promise.resolve(`/files/${path}`)
    const manager = new ContextManager({path: "folder/notebook.ipynb"} as any, {getDownloadUrl} as any)
    try {
      await expect(manager.fileUrl("reports/plot.html")).resolves.toBe("/files/folder/reports/plot.html")
      for (const path of ["/private/output.html", "../output.html", "reports/../../output.html", "reports\\output.html"]) {
        await expect(manager.fileUrl(path)).rejects.toMatchObject({code: "FILE_PATH_UNAVAILABLE"})
      }
    } finally {
      manager.dispose()
    }
  })

  it("uses the current Jupyter server route for remote local applications", () => {
    const contents = {serverSettings: {baseUrl: "/user/alice/"}}
    const manager = new ContextManager({path: "notebook.ipynb"} as any, contents as any)
    try {
      expect(manager.applicationUrl("http://127.0.0.1:4312/bokeh-notebook/nonce/")).toBe(
        "https://jupyter.example.test/user/alice/proxy/4312/bokeh-notebook/nonce/",
      )
    } finally {
      manager.dispose()
    }
  })
})
