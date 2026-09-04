export const PROTOCOL_VERSION = 2
export const ARTIFACT_MIME_TYPE = "application/vnd.bokeh.embed+json"
export const RESOURCES_MIME_TYPE = "application/vnd.bokeh.resources+json"
export const DISPLAY_MIME_TYPE = "application/vnd.bokeh.display+json"
export const FILE_MIME_TYPE = "application/vnd.bokeh.file+json"
export const NOTEBOOK_COMM_TARGET = "bokeh.notebook.v1"
export const RESOURCE_COMM_TARGET = "bokeh.resources.v1"
export const MAX_PENDING_PATCHES = 64
export const MAX_PENDING_BYTES = 8 * 1024 * 1024

export interface ResourceArtifact {
  id: string
  kind: "js" | "css"
  source: "url" | "inline"
  url?: string
  integrity?: string
  crossorigin?: string
  nonce?: string
  module?: boolean
  core?: boolean
}

export interface ResourcePayload {
  protocol_version: number
  kind: "resources"
  resource_id: string
  mode: string
  bokeh_version: string
  python_version: string
  requirements: Record<string, unknown>
  policy: Record<string, unknown>
  dependencies: string[]
  artifacts: ResourceArtifact[]
  warnings: string[]
  load_timeout: number
}

export interface DisplayPayload {
  protocol_version: number
  kind: "artifact"
  resource_id: string
  bokeh_version: string
  python_version: string
  artifact_fingerprint: string
  source_kind: "standalone" | "server"
  view_id: string
  connect_timeout: number
  live_id?: string
  application_id?: string
  application_url?: string
}

export interface FilePayload {
  protocol_version: number
  kind: "file"
  path: string
}

export function assertProtocol(payload: unknown): void {
  if (payload == null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new BokehNotebookError(
      "PAYLOAD_INVALID",
      "The notebook output does not contain a Bokeh MIME payload object.",
      "Re-run the cell. If the problem persists, restart the kernel and reload the notebook.",
    )
  }
  const record = payload as Record<string, unknown>
  if (record.protocol_version !== PROTOCOL_VERSION) {
    throw new BokehNotebookError(
      "PROTOCOL_VERSION_MISMATCH",
      `This output uses Bokeh notebook protocol ${record.protocol_version ?? "unknown"}, but the extension supports ${PROTOCOL_VERSION}.`,
      "Restart the kernel and reload the notebook after updating Bokeh.",
    )
  }
  if (record.kind !== "resources" && record.kind !== "artifact" && record.kind !== "file") {
    throw new BokehNotebookError(
      "PAYLOAD_INVALID",
      `The Bokeh MIME payload has an unknown kind: ${String(record.kind ?? "missing")}.`,
      "Re-run the cell with the same Bokeh version as the frontend extension.",
    )
  }
  const problems: string[] = []
  const stringField = (name: string) => {
    if (typeof record[name] !== "string" || (record[name] as string).length === 0) problems.push(`${name} must be a non-empty string`)
  }
  const stringArray = (name: string) => {
    if (!Array.isArray(record[name]) || !(record[name] as unknown[]).every((value) => typeof value === "string")) problems.push(`${name} must be a string array`)
  }
  const timeoutField = (name: string) => {
    const value = record[name]
    if (typeof value !== "number" || !Number.isFinite(value) || value < 100 || value > 300_000) problems.push(`${name} must be between 100 and 300000 ms`)
  }
  if (record.kind !== "file") {
    for (const name of ["bokeh_version", "python_version"]) stringField(name)
  }
  if (record.kind !== "file") stringField("resource_id")
  if (record.kind === "file") {
    stringField("path")
  } else if (record.kind === "resources") {
    stringField("mode")
    for (const name of ["dependencies", "warnings"]) stringArray(name)
    timeoutField("load_timeout")
    if (record.requirements == null || typeof record.requirements !== "object" || Array.isArray(record.requirements)) problems.push("requirements must be an object")
    if (record.policy == null || typeof record.policy !== "object" || Array.isArray(record.policy)) problems.push("policy must be an object")
    if (!Array.isArray(record.artifacts)) {
      problems.push("artifacts must be an array")
    } else {
      for (const [index, value] of record.artifacts.entries()) {
        if (value == null || typeof value !== "object" || Array.isArray(value)) {
          problems.push(`artifacts[${index}] must be an object`)
          continue
        }
        const artifact = value as Record<string, unknown>
        if (typeof artifact.id !== "string" || artifact.id.length === 0) problems.push(`artifacts[${index}].id must be a non-empty string`)
        if (artifact.kind !== "js" && artifact.kind !== "css") problems.push(`artifacts[${index}].kind must be js or css`)
        if (artifact.source !== "url" && artifact.source !== "inline") problems.push(`artifacts[${index}].source must be url or inline`)
        if (artifact.source === "url" && (typeof artifact.url !== "string" || artifact.url.length === 0)) problems.push(`artifacts[${index}].url is required for URL artifacts`)
      }
    }
  } else {
    stringField("artifact_fingerprint")
    stringField("view_id")
    timeoutField("connect_timeout")
    if (record.source_kind !== "standalone" && record.source_kind !== "server") problems.push("source_kind must be standalone or server")
    if (record.live_id != null) stringField("live_id")
    if (record.application_id != null) stringField("application_id")
    if (record.application_url != null) stringField("application_url")
    if ((record.application_id == null) !== (record.application_url == null)) {
      problems.push("application_id and application_url must be provided together")
    }
  }
  if (problems.length !== 0) {
    throw new BokehNotebookError(
      "PAYLOAD_INVALID",
      `The ${record.kind} payload is invalid: ${problems.slice(0, 8).join("; ")}.`,
      "Re-run the cell. If the output was saved by another Bokeh version, restart the kernel first.",
    )
  }
}

export class BokehNotebookError extends Error {
  constructor(readonly code: string, message: string, readonly action: string, readonly cause?: unknown) {
    super(message)
    this.name = "BokehNotebookError"
  }
}
