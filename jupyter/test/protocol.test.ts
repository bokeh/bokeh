import {describe, expect, it} from "vitest"

import * as m from "../src/protocol"

type Payload = Record<string, unknown>
type InvalidCase = [string, (payload: Payload) => void, string]

const resourceArtifact = (): Payload => ({
  id: "js-inline-resource",
  kind: "js",
  source: "inline",
})

const resourcePayload = (): Payload => ({
  protocol_version: m.PROTOCOL_VERSION,
  kind: "resources",
  resource_id: "resource",
  mode: "inline",
  bokeh_version: "4.0.0",
  python_version: "4.0.0",
  requirements: {},
  policy: {},
  dependencies: [],
  artifacts: [resourceArtifact()],
  warnings: [],
  load_timeout: 5000,
})

const displayPayload = (): Payload => ({
  protocol_version: m.PROTOCOL_VERSION,
  kind: "artifact",
  resource_id: "resource",
  bokeh_version: "4.0.0",
  python_version: "4.0.0",
  source_kind: "standalone",
  view_id: "view",
  connect_timeout: 5000,
})

const filePayload = (): Payload => ({
  protocol_version: m.PROTOCOL_VERSION,
  kind: "file",
  path: "plot.html",
})

function expectProtocolError(payload: unknown, code: string, message: string): void {
  const error = (() => {
    try {
      m.assertProtocol(payload)
      return undefined
    } catch (cause) {
      return cause
    }
  })()
  expect(error).toBeInstanceOf(m.BokehNotebookError)
  expect((error as m.BokehNotebookError).code).toBe(code)
  expect((error as m.BokehNotebookError).message).toContain(message)
}

describe("notebook protocol", () => {
  describe("envelope", () => {
    it.each([
      ["null", null],
      ["a primitive", "artifact"],
      ["an array", []],
    ])("rejects %s instead of an object", (_name, payload) => {
      expectProtocolError(payload, "PAYLOAD_INVALID", "does not contain a Bokeh MIME payload object")
    })

    it.each([
      ["a missing version", {kind: "file", path: "plot.html"}],
      ["a non-numeric version", {protocol_version: String(m.PROTOCOL_VERSION), kind: "file", path: "plot.html"}],
    ])("rejects %s", (_name, payload) => {
      expectProtocolError(payload, "PROTOCOL_VERSION_MISMATCH", "does not identify a supported protocol version")
    })

    it("identifies which side of a protocol mismatch is older", () => {
      expectProtocolError(
        {protocol_version: m.PROTOCOL_VERSION + 1},
        "PROTOCOL_VERSION_MISMATCH",
        "The Python-side Bokeh is newer than the frontend extension.",
      )
      expectProtocolError(
        {protocol_version: m.PROTOCOL_VERSION - 1},
        "PROTOCOL_VERSION_MISMATCH",
        "The frontend extension is newer than the Python-side Bokeh.",
      )
    })

    it("rejects unknown payload kinds", () => {
      expectProtocolError(
        {protocol_version: m.PROTOCOL_VERSION, kind: "document"},
        "PAYLOAD_INVALID",
        "unknown kind: document",
      )
    })
  })

  describe("file payload", () => {
    it("accepts a file payload", () => {
      expect(() => m.assertProtocol(filePayload())).not.toThrow()
    })

    it.each([
      ["a missing path", (payload: Payload) => delete payload.path],
      ["an empty path", (payload: Payload) => payload.path = ""],
      ["a non-string path", (payload: Payload) => payload.path = 42],
    ])("rejects %s", (_name, update) => {
      const payload = filePayload()
      update(payload)
      expectProtocolError(payload, "PAYLOAD_INVALID", "path must be a non-empty string")
    })
  })

  describe("resource payload", () => {
    it("accepts resource metadata, dependencies, warnings, and timeout boundaries", () => {
      const first = resourcePayload()
      first.load_timeout = 100
      first.dependencies = ["base-resource"]
      first.warnings = ["fallback resource selected"]
      const second = resourcePayload()
      second.load_timeout = 300_000
      second.artifacts = [{
        id: "css-url-resource",
        kind: "css",
        source: "url",
        url: "https://cdn.example.test/bokeh.css",
        integrity: "sha384-value",
        crossorigin: "anonymous",
        nonce: "nonce",
        module: false,
        core: false,
      }]
      expect(() => m.assertProtocol(first)).not.toThrow()
      expect(() => m.assertProtocol(second)).not.toThrow()
    })

    const invalidCases: InvalidCase[] = [
      ["an empty resource ID", (payload) => payload.resource_id = "", "resource_id must be a non-empty string"],
      ["a non-string Bokeh version", (payload) => payload.bokeh_version = 4, "bokeh_version must be a non-empty string"],
      ["an empty Python version", (payload) => payload.python_version = "", "python_version must be a non-empty string"],
      ["an empty mode", (payload) => payload.mode = "", "mode must be a non-empty string"],
      ["non-array dependencies", (payload) => payload.dependencies = {}, "dependencies must be a string array"],
      ["a non-string dependency", (payload) => payload.dependencies = [1], "dependencies must be a string array"],
      ["an empty dependency ID", (payload) => payload.dependencies = [""], "dependencies must be a string array"],
      ["a non-string warning", (payload) => payload.warnings = [false], "warnings must be a string array"],
      ["a timeout below the minimum", (payload) => payload.load_timeout = 99, "load_timeout must be between 100 and 300000 ms"],
      ["a non-finite timeout", (payload) => payload.load_timeout = Number.POSITIVE_INFINITY, "load_timeout must be between 100 and 300000 ms"],
      ["a timeout above the maximum", (payload) => payload.load_timeout = 300_001, "load_timeout must be between 100 and 300000 ms"],
      ["array requirements", (payload) => payload.requirements = [], "requirements must be an object"],
      ["a null policy", (payload) => payload.policy = null, "policy must be an object"],
      ["non-array artifacts", (payload) => payload.artifacts = {}, "artifacts must be an array"],
      ["a non-object artifact", (payload) => payload.artifacts = [null], "artifacts[0] must be an object"],
      ["an empty artifact ID", (payload) => payload.artifacts = [{...resourceArtifact(), id: ""}], "artifacts[0].id must be a non-empty string"],
      ["an unknown artifact kind", (payload) => payload.artifacts = [{...resourceArtifact(), kind: "wasm"}], "artifacts[0].kind must be js or css"],
      ["an unknown artifact source", (payload) => payload.artifacts = [{...resourceArtifact(), source: "file"}], "artifacts[0].source must be url or inline"],
      ["a URL artifact without a URL", (payload) => payload.artifacts = [{...resourceArtifact(), source: "url"}], "artifacts[0].url is required for URL artifacts"],
      ["null artifact string metadata", (payload) => payload.artifacts = [{...resourceArtifact(), nonce: null}], "artifacts[0].nonce must be a string"],
      ["non-string artifact metadata", (payload) => payload.artifacts = [{...resourceArtifact(), integrity: 42}], "artifacts[0].integrity must be a string"],
      ["null artifact boolean metadata", (payload) => payload.artifacts = [{...resourceArtifact(), core: null}], "artifacts[0].core must be a boolean"],
      ["non-boolean artifact metadata", (payload) => payload.artifacts = [{...resourceArtifact(), module: "true"}], "artifacts[0].module must be a boolean"],
    ]

    it.each(invalidCases)("rejects %s", (_name, update, message) => {
      const payload = resourcePayload()
      update(payload)
      expectProtocolError(payload, "PAYLOAD_INVALID", message)
    })
  })

  describe("display payload", () => {
    it("accepts standalone, live, and managed application displays", () => {
      const live = {...displayPayload(), live_id: "live"}
      const application = {
        ...displayPayload(),
        source_kind: "server",
        application_id: "application",
        resource_records: [{payload: resourcePayload(), javascript: "window.loadBokeh()"}],
      }
      expect(() => m.assertProtocol(displayPayload())).not.toThrow()
      expect(() => m.assertProtocol(live)).not.toThrow()
      expect(() => m.assertProtocol(application)).not.toThrow()
    })

    const invalidCases: InvalidCase[] = [
      ["an empty resource ID", (payload) => payload.resource_id = "", "resource_id must be a non-empty string"],
      ["an empty Bokeh version", (payload) => payload.bokeh_version = "", "bokeh_version must be a non-empty string"],
      ["a non-string Python version", (payload) => payload.python_version = {}, "python_version must be a non-empty string"],
      ["an empty view ID", (payload) => payload.view_id = "", "view_id must be a non-empty string"],
      ["an unknown source kind", (payload) => payload.source_kind = "remote", "source_kind must be standalone or server"],
      ["a non-numeric timeout", (payload) => payload.connect_timeout = "5000", "connect_timeout must be between 100 and 300000 ms"],
      ["a null live ID", (payload) => payload.live_id = null, "live_id must be a non-empty string"],
      ["an empty application ID", (payload) => payload.application_id = "", "application_id must be a non-empty string"],
      ["a persisted application URL", (payload) => payload.application_url = null, "application_url must not be persisted"],
      ["non-array resource records", (payload) => payload.resource_records = {}, "resource_records must be an array"],
      ["a null resource record", (payload) => payload.resource_records = [null], "resource_records[0] must be an object"],
      ["non-string resource JavaScript", (payload) => payload.resource_records = [{payload: resourcePayload(), javascript: null}], "resource_records[0].javascript must be a string"],
      ["a missing nested resource payload", (payload) => payload.resource_records = [{}], "resource_records[0].payload must be a valid resource payload"],
      ["a non-resource nested payload", (payload) => payload.resource_records = [{payload: filePayload()}], "resource_records[0].payload must be a valid resource payload"],
      ["an invalid nested resource payload", (payload) => {
        const resource = resourcePayload()
        resource.policy = null
        payload.resource_records = [{payload: resource}]
      }, "resource_records[0].payload must be a valid resource payload"],
    ]

    it.each(invalidCases)("rejects %s", (_name, update, message) => {
      const payload = displayPayload()
      update(payload)
      expectProtocolError(payload, "PAYLOAD_INVALID", message)
    })
  })
})
