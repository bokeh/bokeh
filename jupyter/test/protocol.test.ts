import {describe, expect, it} from "vitest"

import {assertProtocol, BokehNotebookError, PROTOCOL_VERSION} from "../src/protocol"

describe("notebook protocol", () => {
  it("accepts an artifact display envelope", () => {
    expect(() => assertProtocol({
      protocol_version: PROTOCOL_VERSION,
      kind: "artifact",
      resource_id: "resource",
      bokeh_version: "4.0.0",
      python_version: "4.0.0",
      source_kind: "standalone",
      view_id: "view",
      connect_timeout: 5000,
    })).not.toThrow()
  })

  it("keeps managed application identity without persisting its kernel-local URL", () => {
    const payload = {
      protocol_version: PROTOCOL_VERSION,
      kind: "artifact",
      resource_id: "resource",
      bokeh_version: "4.0.0",
      python_version: "4.0.0",
      source_kind: "server",
      view_id: "view",
      connect_timeout: 5000,
      application_id: "application",
    }
    expect(() => assertProtocol(payload)).not.toThrow()
    expect(() => assertProtocol({...payload, application_url: "http://127.0.0.1:4312/app/"})).toThrow(/must not be persisted/)
  })

  it("rejects the removed document-data lifecycle", () => {
    expect(() => assertProtocol({
      protocol_version: 1,
      kind: "document",
      document_data_id: "old-owner",
    })).toThrow(BokehNotebookError)
  })

  it("requires explicit resource requirements and policy", () => {
    expect(() => assertProtocol({
      protocol_version: PROTOCOL_VERSION,
      kind: "resources",
      resource_id: "resource",
      mode: "inline",
      bokeh_version: "4.0.0",
      python_version: "4.0.0",
      dependencies: [],
      artifacts: [],
      warnings: [],
      load_timeout: 5000,
    })).toThrow(/requirements must be an object/)
  })
})
