import type {ClientSession} from "../client/session"
import {pull_session} from "../client/connection"
import {Document} from "../document"
import type {DocJson} from "../document"
import type {HasProps} from "../core/has_props"
import type {ModelResolver} from "../core/resolvers"
import {isPlainObject} from "../core/util/types"

import type {ResourceComponent, ResourcePolicy, ResourceRequirements} from "./resources"
import {ResourceError, resource_loader} from "./resources"

export const embed_artifact_schema = "bokeh.embed/v1"

const resource_components = new Set<ResourceComponent>([
  "bokeh/core", "bokeh/widgets", "bokeh/tables", "bokeh/webgl", "bokeh/mathjax", "bokeh/api",
])

/** Logical root address for graph-minimal standalone document data. */
export type StructuralArtifactRoot = {key: string, document: number, root: number}
/** Logical root address for an ID-full live server document. */
export type ServerArtifactRoot = {key: string, model_id: string}
/** Versioned root address selected by the artifact source kind. */
export type ArtifactRoot = StructuralArtifactRoot | ServerArtifactRoot

/** Embedded static documents whose anonymous IDs may be reconstructed. */
export type StandaloneArtifactSource = {
  kind: "standalone"
  documents: DocJson[]
}

/** Connection parameters for a Bokeh server session. */
export type ServerArtifactSource = {
  kind: "server"
  url: string
  session_id?: string
  token?: string
  arguments?: {[key: string]: string}
  headers?: {[key: string]: string}
  credentials?: RequestCredentials
  relative_urls?: boolean
}

/** Validated cross-language envelope accepted by `Bokeh.mount()`. */
export type EmbedArtifact = {
  schema: typeof embed_artifact_schema
  bokeh_version: string
  source: StandaloneArtifactSource | ServerArtifactSource
  roots: ArtifactRoot[]
  requires: ResourceRequirements
  metadata: {[key: string]: unknown}
  buffers: {[key: string]: unknown}[]
  fingerprint: string
}

/** Decoded source plus release hooks transferred to a `BokehMount`. */
export type PreparedArtifact = {
  document: Document
  roots: Map<string, HasProps>
  document_ownership: "mount"
  track_document_roots: boolean
  session?: ClientSession
  release(): void
}

/** Artifact preparation phase attached to structured errors. */
export type ArtifactErrorPhase = "schema" | "fingerprint" | "resource" | "deserialize" | "payload" | "session"
/** Artifact identity and URL context attached to a failure. */
export type ArtifactErrorSource = {
  readonly kind: "artifact"
  readonly artifact?: string
  readonly url?: string
}

/** Schema, decoding, resource, transport, or session preparation failure. */
export class ArtifactError extends Error {
  override readonly name = "BokehArtifactError"
  readonly phase: ArtifactErrorPhase

  constructor(
    readonly kind: "schema" | "decode" | "resource" | "http" | "websocket" | "session",
    message: string,
    override readonly cause?: unknown,
    phase?: ArtifactErrorPhase,
    readonly source?: ArtifactErrorSource,
  ) {
    super(message)
    this.phase = phase ?? (kind == "decode" ? "deserialize" : kind == "http" ? "payload" : kind == "websocket" ? "session" : kind)
  }
}

function as_record(value: unknown, context: string): {[key: string]: unknown} {
  if (!isPlainObject(value)) {
    throw new ArtifactError("schema", `${context} must be an object`)
  }
  return value as {[key: string]: unknown}
}

function as_string(value: unknown, context: string): string {
  if (typeof value != "string" || value.length == 0) {
    throw new ArtifactError("schema", `${context} must be a non-empty string`)
  }
  return value
}

/** Return true only for an object carrying the current artifact schema tag. */
export function is_embed_artifact(value: unknown): value is EmbedArtifact {
  return isPlainObject(value) && (value as {schema?: unknown}).schema == embed_artifact_schema
}

/** Validate the complete public artifact shape without performing I/O. */
export function validate_embed_artifact(value: unknown): EmbedArtifact {
  const artifact = as_record(value, "embedding artifact")
  const schema = as_string(artifact.schema, "artifact.schema")
  if (schema != embed_artifact_schema) {
    throw new ArtifactError(
      "schema", `unsupported embedding artifact schema '${schema}'; expected '${embed_artifact_schema}'`,
    )
  }
  const source = as_record(artifact.source, "artifact.source")
  if (source.kind != "standalone" && source.kind != "server") {
    throw new ArtifactError("schema", "artifact.source.kind must be 'standalone' or 'server'")
  }
  as_string(artifact.bokeh_version, "artifact.bokeh_version")
  as_string(artifact.fingerprint, "artifact.fingerprint")
  if (source.kind == "standalone") {
    if (!Array.isArray(source.documents) || source.documents.length == 0) {
      throw new ArtifactError("schema", "standalone artifact.source.documents must be a non-empty array")
    }
  } else {
    as_string(source.url, "server artifact source.url")
    if (source.credentials != null && !["omit", "same-origin", "include"].includes(`${source.credentials}`)) {
      throw new ArtifactError("schema", "server artifact credentials must be 'omit', 'same-origin', or 'include'")
    }
    for (const field of ["arguments", "headers"] as const) {
      if (source[field] != null) {
        const entries = Object.entries(as_record(source[field], `server artifact source.${field}`))
        if (entries.some(([, item]) => typeof item != "string")) {
          throw new ArtifactError("schema", `server artifact source.${field} values must be strings`)
        }
      }
    }
  }
  if (!Array.isArray(artifact.roots)) {
    throw new ArtifactError("schema", "artifact.roots must be an array")
  }
  const keys = new Set<string>()
  for (const root of artifact.roots) {
    const descriptor = as_record(root, "artifact root")
    const key = as_string(descriptor.key, "artifact root key")
    if (keys.has(key)) {
      throw new ArtifactError("schema", `duplicate artifact root key '${key}'`)
    }
    keys.add(key)
    if (source.kind == "standalone") {
      if (!Number.isInteger(descriptor.document) || !Number.isInteger(descriptor.root) ||
          (descriptor.document as number) < 0 || (descriptor.root as number) < 0) {
        throw new ArtifactError("schema", `standalone root '${key}' requires non-negative integer document/root ordinals`)
      }
    } else {
      as_string(descriptor.model_id, `server root '${key}' model_id`)
    }
  }
  const requires = as_record(artifact.requires, "artifact.requires")
  if (!Array.isArray(requires.components) || requires.components.some((component) =>
    typeof component != "string" || !resource_components.has(component as ResourceComponent))) {
    throw new ArtifactError("schema", "artifact.requires.components contains an unknown resource component")
  }
  if (!Array.isArray(requires.extensions)) {
    throw new ArtifactError("schema", "artifact.requires.extensions must be an array")
  }
  for (const extension of requires.extensions) {
    const declaration = as_record(extension, "artifact resource extension")
    as_string(declaration.name, "artifact resource extension name")
    if (!Array.isArray(declaration.assets)) {
      throw new ArtifactError("schema", "artifact resource extension assets must be an array")
    }
    for (const asset of declaration.assets) {
      const resource = as_record(asset, "artifact extension resource")
      if (resource.kind != "script" && resource.kind != "style") {
        throw new ArtifactError("schema", "artifact extension resource kind must be 'script' or 'style'")
      }
      if ((typeof resource.url == "string") == (typeof resource.content == "string")) {
        throw new ArtifactError("schema", "artifact extension resources need exactly one of 'url' or 'content'")
      }
    }
  }
  as_record(artifact.metadata, "artifact.metadata")
  if (!Array.isArray(artifact.buffers) || artifact.buffers.some((buffer) => !isPlainObject(buffer))) {
    throw new ArtifactError("schema", "artifact.buffers must be an array")
  }
  return artifact as EmbedArtifact
}

/**
 * Validate, fingerprint, satisfy resources, and decode an artifact for mounting.
 * The caller assumes ownership of the returned document, session, and release hook.
 */
export async function prepare_embed_artifact(value: unknown, policy: ResourcePolicy = "auto",
    resolver?: ModelResolver, signal?: AbortSignal): Promise<PreparedArtifact> {
  const artifact = validate_embed_artifact(value)
  const fingerprint = await compute_embed_artifact_fingerprint(artifact)
  if (artifact.fingerprint != fingerprint) {
    throw new ArtifactError(
      "schema", `artifact fingerprint mismatch: expected '${fingerprint}', received '${artifact.fingerprint}'`,
      undefined, "fingerprint", {kind: "artifact", artifact: artifact.fingerprint},
    )
  }
  try {
    await resource_loader.ensure(artifact.requires, policy, artifact.bokeh_version)
  } catch (error) {
    if (error instanceof ResourceError) {
      throw new ArtifactError(
        "resource", error.message, error, "resource", {kind: "artifact", artifact: artifact.fingerprint},
      )
    }
    throw error
  }
  if (signal?.aborted == true) {
    throw signal.reason
  }
  return artifact.source.kind == "standalone"
    ? prepare_standalone(artifact, resolver)
    : prepare_server(artifact, signal)
}

/** Compute the normalized cross-language SHA-256 artifact identity. */
export async function compute_embed_artifact_fingerprint(artifact: EmbedArtifact): Promise<string> {
  const payload = normalize_model_ids({
    schema: artifact.schema,
    bokeh_version: artifact.bokeh_version,
    source: artifact.source,
    roots: artifact.roots,
    requires: artifact.requires,
    metadata: artifact.metadata,
    buffers: artifact.buffers,
  })
  const encoded = new TextEncoder().encode(JSON.stringify(sort_keys(payload)))
  const digest = await globalThis.crypto.subtle.digest("SHA-256", encoded)
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("")
}

function normalize_model_ids(value: unknown): unknown {
  const ids: string[] = []
  const collect = (child: unknown): void => {
    if (isPlainObject(child)) {
      const record = child as {[key: string]: unknown}
      if (record.type == "object" && typeof record.id == "string" && !ids.includes(record.id)) {
        ids.push(record.id)
      }
      for (const key of Object.keys(record).sort()) {
        collect(record[key])
      }
    } else if (Array.isArray(child)) {
      child.forEach(collect)
    }
  }
  collect(value)
  const replacements = new Map(ids.map((id, index) => [id, `model-${index}`]))

  const replace = (child: unknown): unknown => {
    if (isPlainObject(child)) {
      return Object.fromEntries(Object.entries(child as {[key: string]: unknown}).map(([key, item]) => [
        key,
        key == "id" && typeof item == "string" ? replacements.get(item) ?? item : replace(item),
      ]))
    } else if (Array.isArray(child)) {
      return child.map(replace)
    } else {
      return child
    }
  }
  return replace(value)
}

function sort_keys(value: unknown): unknown {
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [
      key, sort_keys((value as {[key: string]: unknown})[key]),
    ]))
  } else if (Array.isArray(value)) {
    return value.map(sort_keys)
  } else {
    return value
  }
}

function prepare_standalone(artifact: EmbedArtifact, resolver?: ModelResolver): PreparedArtifact {
  const {documents} = artifact.source as StandaloneArtifactSource
  if (!Array.isArray(documents) || documents.length != 1) {
    throw new ArtifactError(
      "schema", "Bokeh 4.0 artifacts currently normalize standalone input to exactly one document; split independent documents",
    )
  }
  let document: Document
  try {
    document = Document.from_json(documents[0], {resolver})
  } catch (error) {
    throw new ArtifactError(
      "decode", `failed to decode standalone Bokeh artifact: ${error}`, error,
      "deserialize", {kind: "artifact", artifact: artifact.fingerprint},
    )
  }
  try {
    const roots = new Map<string, HasProps>()
    for (const descriptor of artifact.roots as StructuralArtifactRoot[]) {
      if (descriptor.document != 0) {
        throw new ArtifactError("schema", `artifact root '${descriptor.key}' refers to missing document ${descriptor.document}`)
      }
      const document_roots = document.roots()
      if (descriptor.root < 0 || descriptor.root >= document_roots.length) {
        throw new ArtifactError("schema", `artifact root '${descriptor.key}' refers to missing root ${descriptor.root}`)
      }
      const root = document_roots[descriptor.root]
      roots.set(descriptor.key, root)
    }
    return {
      document,
      roots,
      document_ownership: "mount",
      track_document_roots: false,
      release: () => {},
    }
  } catch (error) {
    document.destroy()
    throw error
  }
}

async function prepare_server(artifact: EmbedArtifact, signal?: AbortSignal): Promise<PreparedArtifact> {
  const source = artifact.source as ServerArtifactSource
  const configured_app = source.url == "." ? new URL(window.location.href) : new URL(source.url, document.baseURI)
  const app = source.relative_urls == true
    ? new URL(`${configured_app.pathname}${configured_app.search}`, document.baseURI)
    : configured_app
  let token = source.token
  if (token == null) {
    const endpoint = new URL(app.href)
    endpoint.pathname = `${app.pathname.replace(/\/$/, "")}/embed.json`
    endpoint.search = ""
    for (const [key, value] of Object.entries(source.arguments ?? {})) {
      if (!key.startsWith("bokeh-")) {
        endpoint.searchParams.append(key, value)
      }
    }
    const headers = new Headers(source.headers ?? {})
    if (source.session_id != null) {
      headers.set("Bokeh-Session-Id", source.session_id)
    }
    let response: Response
    try {
      response = await fetch(endpoint, {headers, credentials: source.credentials ?? "same-origin", signal})
    } catch (error) {
      throw new ArtifactError(
        "http", `failed to request Bokeh server artifact from ${endpoint}: ${error}`, error,
        "payload", {kind: "artifact", artifact: artifact.fingerprint, url: endpoint.href},
      )
    }
    if (!response.ok) {
      throw new ArtifactError(
        "http", `Bokeh server artifact request failed: ${response.status} ${response.statusText}`,
        response, "payload", {kind: "artifact", artifact: artifact.fingerprint, url: endpoint.href},
      )
    }
    const bootstrap = as_record(await response.json(), "Bokeh server bootstrap")
    if (bootstrap.schema != "bokeh.embed-server/v1") {
      throw new ArtifactError(
        "schema", `unsupported Bokeh server bootstrap schema '${bootstrap.schema}'; expected 'bokeh.embed-server/v1'`,
        undefined, "schema", {kind: "artifact", artifact: artifact.fingerprint, url: endpoint.href},
      )
    }
    if (bootstrap.bokeh_version != artifact.bokeh_version) {
      throw new ArtifactError(
        "schema", `Bokeh server bootstrap version '${bootstrap.bokeh_version}' does not match artifact version '${artifact.bokeh_version}'`,
        undefined, "schema", {kind: "artifact", artifact: artifact.fingerprint, url: endpoint.href},
      )
    }
    token = as_string(bootstrap.token, "Bokeh server bootstrap token")
  }

  const websocket_url = `${app.protocol == "https:" ? "wss:" : "ws:"}//${app.host}${app.pathname.replace(/\/$/, "")}/ws`
  let session: ClientSession
  try {
    const args = new URLSearchParams(source.arguments ?? {}).toString()
    session = await pull_session(websocket_url, token, args)
  } catch (error) {
    throw new ArtifactError(
      "websocket", `failed to open Bokeh server session at ${websocket_url}: ${error}`, error,
      "session", {kind: "artifact", artifact: artifact.fingerprint, url: websocket_url},
    )
  }

  try {
    const roots = new Map<string, HasProps>()
    if (artifact.roots.length == 0) {
      const document_roots = session.document.roots()
      for (const [index, root] of document_roots.entries()) {
        roots.set(document_roots.length == 1 ? "root" : `root-${index}`, root)
      }
    } else {
      for (const descriptor of artifact.roots as ServerArtifactRoot[]) {
        const root = session.document.get_model_by_id(descriptor.model_id)
        if (root == null || !session.document.roots().includes(root)) {
          throw new ArtifactError(
            "session", `server artifact root '${descriptor.key}' does not identify a document root`,
          )
        }
        roots.set(descriptor.key, root)
      }
    }
    return {
      document: session.document,
      roots,
      document_ownership: "mount",
      track_document_roots: artifact.roots.length == 0,
      session,
      release() {
        session.close()
      },
    }
  } catch (error) {
    session.close()
    session.document.destroy()
    throw error
  }
}
