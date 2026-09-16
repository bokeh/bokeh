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
  if ("buffers" in artifact) {
    throw new ArtifactError(
      "schema", "artifact buffers are not part of bokeh.embed/v1; binary server data uses protocol message buffers",
    )
  }
  if (source.kind != "standalone" && source.kind != "server") {
    throw new ArtifactError("schema", "artifact.source.kind must be 'standalone' or 'server'")
  }
  as_string(artifact.bokeh_version, "artifact.bokeh_version")
  as_string(artifact.fingerprint, "artifact.fingerprint")
  if (source.kind == "standalone") {
    if (!Array.isArray(source.documents) || source.documents.length != 1) {
      throw new ArtifactError("schema", "standalone artifact.source.documents must contain exactly one document")
    }
    if (source.documents.some((document) => !isPlainObject(document))) {
      throw new ArtifactError("schema", "standalone artifact documents must be objects")
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
    for (const field of ["session_id", "token"] as const) {
      if (source[field] != null) {
        as_string(source[field], `server artifact source.${field}`)
      }
    }
    if (source.relative_urls != null && typeof source.relative_urls != "boolean") {
      throw new ArtifactError("schema", "server artifact source.relative_urls must be a boolean")
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
      if ("model_id" in descriptor) {
        throw new ArtifactError("schema", `standalone root '${key}' cannot declare model_id`)
      }
      if (!Number.isInteger(descriptor.document) || !Number.isInteger(descriptor.root) ||
          (descriptor.document as number) < 0 || (descriptor.root as number) < 0) {
        throw new ArtifactError("schema", `standalone root '${key}' requires non-negative integer document/root ordinals`)
      }
      if (descriptor.document != 0) {
        throw new ArtifactError("schema", `standalone root '${key}' refers to missing document ${descriptor.document}`)
      }
      const document = (source.documents as unknown[])[0] as {[key: string]: unknown}
      if (!Array.isArray(document.roots) || (descriptor.root as number) >= document.roots.length) {
        throw new ArtifactError("schema", `standalone root '${key}' refers to missing root ${descriptor.root}`)
      }
    } else {
      if ("document" in descriptor || "root" in descriptor) {
        throw new ArtifactError("schema", `server root '${key}' cannot declare document/root ordinals`)
      }
      as_string(descriptor.model_id, `server root '${key}' model_id`)
    }
  }
  const requires = as_record(artifact.requires, "artifact.requires")
  if (!Array.isArray(requires.components) || requires.components.some((component) =>
    typeof component != "string" || !resource_components.has(component as ResourceComponent))) {
    throw new ArtifactError("schema", "artifact.requires.components contains an unknown resource component")
  }
  if (new Set(requires.components).size != requires.components.length) {
    throw new ArtifactError("schema", "artifact.requires.components must be unique")
  }
  if (!Array.isArray(requires.extensions)) {
    throw new ArtifactError("schema", "artifact.requires.extensions must be an array")
  }
  const extension_names = new Set<string>()
  for (const extension of requires.extensions) {
    const declaration = as_record(extension, "artifact resource extension")
    const name = as_string(declaration.name, "artifact resource extension name")
    if (extension_names.has(name)) {
      throw new ArtifactError("schema", `duplicate artifact resource extension '${name}'`)
    }
    extension_names.add(name)
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
      if ("nonce" in resource) {
        throw new ArtifactError("schema", "artifact extension resource nonce is host-owned")
      }
      for (const field of ["integrity", "crossorigin"] as const) {
        if (resource[field] != null && typeof resource[field] != "string") {
          throw new ArtifactError("schema", `artifact extension resource ${field} must be a string`)
        }
      }
      if (resource.module != null && typeof resource.module != "boolean") {
        throw new ArtifactError("schema", "artifact extension resource module must be a boolean")
      }
      if (resource.kind == "style" && resource.module == true) {
        throw new ArtifactError("schema", "artifact extension style resources cannot be modules")
      }
    }
  }
  as_record(artifact.metadata, "artifact.metadata")
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
  const source = artifact.source.kind == "standalone" ? {
    ...artifact.source,
    documents: artifact.source.documents.map(normalize_model_ids) as DocJson[],
  } : artifact.source
  const payload = {
    schema: artifact.schema,
    bokeh_version: artifact.bokeh_version,
    source,
    roots: artifact.roots,
    requires: artifact.requires,
    metadata: artifact.metadata,
  }
  const encoded = new TextEncoder().encode(canonical_json(payload))
  const {crypto} = globalThis as unknown as {crypto?: {subtle?: SubtleCrypto}}
  const subtle = crypto?.subtle
  const digest = subtle != null
    ? new Uint8Array(await subtle.digest("SHA-256", encoded))
    : sha256(encoded)
  return [...digest].map((value) => value.toString(16).padStart(2, "0")).join("")
}

// Web Crypto isn't available on non-secure origins such as file:// export pages.
function sha256(input: Uint8Array): Uint8Array {
  const constants = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ])
  const state = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ])
  const size = Math.ceil((input.length + 9)/64)*64
  const padded = new Uint8Array(size)
  padded.set(input)
  padded[input.length] = 0x80
  const view = new DataView(padded.buffer)
  const bits = input.length*8
  view.setUint32(size - 8, Math.floor(bits/2**32))
  view.setUint32(size - 4, bits)

  const words = new Uint32Array(64)
  const rotate = (value: number, amount: number) => (value >>> amount) | (value << (32 - amount))
  for (let offset = 0; offset < size; offset += 64) {
    for (let i = 0; i < 16; i++) {
      words[i] = view.getUint32(offset + i*4)
    }
    for (let i = 16; i < 64; i++) {
      const x = words[i - 15]
      const y = words[i - 2]
      const s0 = rotate(x, 7) ^ rotate(x, 18) ^ (x >>> 3)
      const s1 = rotate(y, 17) ^ rotate(y, 19) ^ (y >>> 10)
      words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0
    }

    let [a, b, c, d, e, f, g, h] = state
    for (let i = 0; i < 64; i++) {
      const sum1 = rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25)
      const choice = (e & f) ^ (~e & g)
      const temp1 = (h + sum1 + choice + constants[i] + words[i]) >>> 0
      const sum0 = rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)
      const majority = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (sum0 + majority) >>> 0
      ;[a, b, c, d, e, f, g, h] = [(temp1 + temp2) >>> 0, a, b, c, (d + temp1) >>> 0, e, f, g]
    }
    state.set([
      (state[0] + a) >>> 0, (state[1] + b) >>> 0, (state[2] + c) >>> 0, (state[3] + d) >>> 0,
      (state[4] + e) >>> 0, (state[5] + f) >>> 0, (state[6] + g) >>> 0, (state[7] + h) >>> 0,
    ])
  }

  const digest = new Uint8Array(32)
  const digest_view = new DataView(digest.buffer)
  state.forEach((value, index) => digest_view.setUint32(index*4, value))
  return digest
}

function normalize_model_ids(value: unknown): unknown {
  const ids: string[] = []
  const seen = new Set<string>()
  const collect = (child: unknown): void => {
    if (isPlainObject(child)) {
      const record = child as {[key: string]: unknown}
      if (record.type == "object" && typeof record.id == "string" && !seen.has(record.id)) {
        seen.add(record.id)
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

function canonical_json(value: unknown): string {
  if (value == null || typeof value == "boolean" || typeof value == "string") {
    return JSON.stringify(value)
  }
  if (typeof value == "number") {
    if (!Number.isFinite(value)) {
      throw new ArtifactError("schema", "artifact numbers must be finite")
    }
    if (Number.isInteger(value) && !Number.isSafeInteger(value)) {
      throw new ArtifactError("schema", `artifact integer ${value} exceeds JavaScript's safe integer range`)
    }
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonical_json).join(",")}]`
  }
  if (isPlainObject(value)) {
    const record = value as {[key: string]: unknown}
    return `{${Object.keys(record).sort().map((key) =>
      `${JSON.stringify(key)}:${canonical_json(record[key])}`).join(",")}}`
  }
  throw new ArtifactError("schema", `artifact value of type '${typeof value}' is not JSON-compatible`)
}

function prepare_standalone(artifact: EmbedArtifact, resolver?: ModelResolver): PreparedArtifact {
  const {documents} = artifact.source as StandaloneArtifactSource
  if (!Array.isArray(documents) || documents.length != 1) {
    throw new ArtifactError(
      "schema", "Bokeh 4.0 artifacts currently normalize standalone input to exactly one document; split independent documents",
    )
  }
  const document = (() => {
    try {
      return Document.from_json(documents[0], {resolver})
    } catch (error) {
      throw new ArtifactError(
        "decode", `failed to decode standalone Bokeh artifact: ${error}`, error,
        "deserialize", {kind: "artifact", artifact: artifact.fingerprint},
      )
    }
  })()
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
  const token = await (async () => {
    if (source.token != null) {
      return source.token
    }

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
    const response = await (async () => {
      try {
        return await fetch(endpoint, {headers, credentials: source.credentials ?? "same-origin", signal})
      } catch (error) {
        throw new ArtifactError(
          "http", `failed to request Bokeh server artifact from ${endpoint}: ${error}`, error,
          "payload", {kind: "artifact", artifact: artifact.fingerprint, url: endpoint.href},
        )
      }
    })()
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
    return as_string(bootstrap.token, "Bokeh server bootstrap token")
  })()

  const websocket_url = `${app.protocol == "https:" ? "wss:" : "ws:"}//${app.host}${app.pathname.replace(/\/$/, "")}/ws`
  const session = await (async () => {
    try {
      const args = new URLSearchParams(source.arguments ?? {}).toString()
      return await pull_session(websocket_url, token, args, signal)
    } catch (error) {
      if (signal?.aborted == true) {
        throw signal.reason
      }
      throw new ArtifactError(
        "websocket", `failed to open Bokeh server session at ${websocket_url}: ${error}`, error,
        "session", {kind: "artifact", artifact: artifact.fingerprint, url: websocket_url},
      )
    }
  })()

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
