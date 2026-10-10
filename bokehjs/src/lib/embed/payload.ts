import type {ClientSession} from "../client/session"
import {pull_session} from "../client/connection"
import {Document} from "../document"
import type {DocJson} from "../document"
import type {HasProps} from "../core/has_props"
import type {ModelResolver} from "../core/resolvers"
import {isPlainObject} from "../core/util/types"

import type {ResourceAsset, ResourceComponent, ResourcePolicy, ResourceRequirements} from "./resources"
import {ResourceError, resource_loader} from "./resources"

export const embed_schema = "bokeh.embed/v1"

const resource_components = new Set<ResourceComponent>([
  "bokeh/core", "bokeh/widgets", "bokeh/tables", "bokeh/webgl", "bokeh/mathjax", "bokeh/api",
])

/** Logical root address for graph-minimal standalone document data. */
export type StructuralEmbedRoot = {key: string, document: number, root: number}
/** Logical root address for an ID-full live server document. */
export type ServerEmbedRoot = {key: string, model_id: string}
/** Versioned root address selected by the embed source kind. */
export type EmbedRoot = StructuralEmbedRoot | ServerEmbedRoot

/** Embedded static documents whose anonymous IDs may be reconstructed. */
export type StandaloneEmbedSource = {
  kind: "standalone"
  documents: DocJson[]
}

/** Connection parameters for a Bokeh server session. */
export type ServerEmbedSource = {
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
export type EmbedPayload = {
  schema: typeof embed_schema
  bokeh_version: string
  source: StandaloneEmbedSource | ServerEmbedSource
  roots: EmbedRoot[]
  requires: ResourceRequirements
  metadata: {[key: string]: unknown}
}

/** Decoded source plus release hooks transferred to a `BokehMount`. */
export type PreparedEmbed = {
  document: Document
  roots: Map<string, HasProps>
  document_ownership: "mount"
  track_document_roots: boolean
  session?: ClientSession
  release(): void
}

/** Embed preparation phase attached to structured errors. */
export type EmbedErrorPhase = "schema" | "resource" | "deserialize" | "payload" | "session"
/** Embed identity and URL context attached to a failure. */
export type EmbedErrorSource = {
  readonly kind: "embed"
  readonly embed?: string
  readonly url?: string
}

/** Schema, decoding, resource, transport, or session preparation failure. */
export class EmbedError extends Error {
  override readonly name = "BokehEmbedError"
  readonly phase: EmbedErrorPhase

  constructor(
    readonly kind: "schema" | "decode" | "resource" | "http" | "websocket" | "session",
    message: string,
    override readonly cause?: unknown,
    phase?: EmbedErrorPhase,
    readonly source?: EmbedErrorSource,
  ) {
    super(message)
    this.phase = phase ?? (kind == "decode" ? "deserialize" : kind == "http" ? "payload" : kind == "websocket" ? "session" : kind)
  }
}

function as_record(value: unknown, context: string): {[key: string]: unknown} {
  if (!isPlainObject(value)) {
    throw new EmbedError("schema", `${context} must be an object`)
  }
  return value as {[key: string]: unknown}
}

function as_string(value: unknown, context: string): string {
  if (typeof value != "string" || value.length == 0) {
    throw new EmbedError("schema", `${context} must be a non-empty string`)
  }
  return value
}

function reject_unknown_fields(value: {[key: string]: unknown}, allowed: readonly string[], context: string): void {
  const expected = new Set(allowed)
  const unknown = Object.keys(value).filter((field) => !expected.has(field)).sort()
  if (unknown.length != 0) {
    throw new EmbedError("schema", `${context} contains unknown fields: ${unknown.join(", ")}`)
  }
}

function validate_json_value(value: unknown, context: string, ancestors: Set<object> = new Set()): void {
  if (value == null || typeof value == "boolean" || typeof value == "string") {
    return
  }
  if (typeof value == "number") {
    if (!Number.isFinite(value)) {
      throw new EmbedError("schema", `${context} must be finite`)
    }
    return
  }
  if (!Array.isArray(value) && !isPlainObject(value)) {
    throw new EmbedError("schema", `${context} must be JSON-compatible`)
  }
  if (ancestors.has(value)) {
    throw new EmbedError("schema", `${context} must not contain cyclic values`)
  }
  ancestors.add(value)
  if (Array.isArray(value)) {
    value.forEach((item, index) => validate_json_value(item, `${context}[${index}]`, ancestors))
  } else {
    for (const [key, item] of Object.entries(value)) {
      validate_json_value(item, `${context}.${key}`, ancestors)
    }
  }
  ancestors.delete(value)
}

function validate_server_url(value: unknown): string {
  const url = as_string(value, "server embed source.url")
  if (url.startsWith("//")) {
    throw new EmbedError("schema", "server embed source.url cannot be scheme-relative")
  }
  let parsed: URL
  try {
    parsed = new URL(url, "https://bokeh.invalid/")
  } catch {
    throw new EmbedError("schema", "server embed source.url must be HTTP(S) or relative")
  }
  const scheme = /^[A-Za-z][A-Za-z0-9+.-]*:/.test(url)
  if (scheme && parsed.protocol != "http:" && parsed.protocol != "https:") {
    throw new EmbedError("schema", "server embed source.url must be HTTP(S) or relative")
  }
  if (parsed.search != "" || parsed.hash != "") {
    throw new EmbedError("schema", "server embed source.url cannot contain a query or fragment")
  }
  return url
}

function validate_resource_requirements(value: unknown, context: string): ResourceRequirements {
  const requires = as_record(value, context)
  reject_unknown_fields(requires, ["components", "extensions"], "embed resource requirements")
  if (!Array.isArray(requires.components) || requires.components.some((component) =>
    typeof component != "string" || !resource_components.has(component as ResourceComponent))) {
    throw new EmbedError("schema", "payload.requires.components contains an unknown resource component")
  }
  if (new Set(requires.components).size != requires.components.length) {
    throw new EmbedError("schema", "payload.requires.components must be unique")
  }
  if (!Array.isArray(requires.extensions)) {
    throw new EmbedError("schema", "payload.requires.extensions must be an array")
  }
  const extension_names = new Set<string>()
  for (const extension of requires.extensions) {
    const declaration = as_record(extension, "embed resource extension")
    reject_unknown_fields(declaration, ["name", "assets"], "embed resource extension")
    const name = as_string(declaration.name, "embed resource extension name")
    if (extension_names.has(name)) {
      throw new EmbedError("schema", `duplicate embed resource extension '${name}'`)
    }
    extension_names.add(name)
    if (!Array.isArray(declaration.assets)) {
      throw new EmbedError("schema", "embed resource extension assets must be an array")
    }
    for (const asset of declaration.assets) {
      const resource = as_record(asset, "embed extension resource")
      if (resource.kind != "script" && resource.kind != "style") {
        throw new EmbedError("schema", "embed extension resource kind must be 'script' or 'style'")
      }
      const locators = [resource.url, resource.content, resource.package].filter((item) => typeof item == "string")
      if (locators.length != 1 || [resource.url, resource.content, resource.package].some((item) =>
        item != null && typeof item != "string")) {
        throw new EmbedError(
          "schema", "embed extension resources need exactly one of 'url', 'content', or 'package'",
        )
      }
      if (typeof resource.package == "string" && resource.package.length == 0) {
        throw new EmbedError("schema", "embed extension resource package must be a non-empty string")
      }
      if ("nonce" in resource) {
        throw new EmbedError("schema", "embed extension resource nonce is host-owned")
      }
      reject_unknown_fields(
        resource, ["kind", "url", "content", "package", "integrity", "crossorigin", "module"],
        "embed extension resource",
      )
      for (const field of ["integrity", "crossorigin"] as const) {
        if (resource[field] != null && typeof resource[field] != "string") {
          throw new EmbedError("schema", `embed extension resource ${field} must be a string`)
        }
      }
      if (resource.module != null && typeof resource.module != "boolean") {
        throw new EmbedError("schema", "embed extension resource module must be a boolean")
      }
      if (resource.kind == "style" && resource.module == true) {
        throw new EmbedError("schema", "embed extension style resources cannot be modules")
      }
      if (resource.kind == "style" && resource.package != null) {
        throw new EmbedError("schema", "packaged extension resources must be scripts")
      }
    }
  }
  return requires as unknown as ResourceRequirements
}

function validate_resolved_assets(value: unknown): ResourceAsset[] {
  if (!Array.isArray(value)) {
    throw new EmbedError("schema", "Bokeh server bootstrap resources.assets must be an array")
  }
  for (const asset of value) {
    const resource = as_record(asset, "Bokeh server bootstrap resource")
    reject_unknown_fields(
      resource, ["kind", "url", "content", "content_sha256", "integrity", "crossorigin", "nonce", "module"],
      "Bokeh server bootstrap resource",
    )
    if (resource.kind != "script" && resource.kind != "style") {
      throw new EmbedError("schema", "Bokeh server bootstrap resource kind must be 'script' or 'style'")
    }
    if ((typeof resource.url == "string") == (typeof resource.content == "string") ||
        [resource.url, resource.content].some((item) => item != null && typeof item != "string")) {
      throw new EmbedError("schema", "Bokeh server bootstrap resources need exactly one of 'url' or 'content'")
    }
    for (const field of ["integrity", "crossorigin", "nonce"] as const) {
      if (resource[field] != null && typeof resource[field] != "string") {
        throw new EmbedError("schema", `Bokeh server bootstrap resource ${field} must be a string`)
      }
    }
    if (resource.module != null && typeof resource.module != "boolean") {
      throw new EmbedError("schema", "Bokeh server bootstrap resource module must be a boolean")
    }
    if (resource.content_sha256 != null && (
      typeof resource.content_sha256 != "string" || !/^[0-9a-f]{64}$/.test(resource.content_sha256) ||
      typeof resource.content != "string"
    )) {
      throw new EmbedError(
        "schema", "Bokeh server bootstrap resource content_sha256 requires inline content and 64 lowercase hex digits",
      )
    }
    if (resource.kind == "style" && resource.module == true) {
      throw new EmbedError("schema", "Bokeh server bootstrap style resources cannot be modules")
    }
  }
  return value as ResourceAsset[]
}

/** Return true only for an object carrying the current embed schema tag. */
export function is_embed_payload(value: unknown): value is EmbedPayload {
  return isPlainObject(value) && (value as {schema?: unknown}).schema == embed_schema
}

/** Validate the complete public embed payload shape without performing I/O. */
export function validate_embed_payload(value: unknown): EmbedPayload {
  const payload = as_record(value, "embed payload")
  const schema = as_string(payload.schema, "payload.schema")
  if (schema != embed_schema) {
    throw new EmbedError(
      "schema", `unsupported embed schema '${schema}'; expected '${embed_schema}'`,
    )
  }
  const source = as_record(payload.source, "payload.source")
  if ("buffers" in payload) {
    throw new EmbedError(
      "schema", "buffers are not part of bokeh.embed/v1; binary server data uses protocol message buffers",
    )
  }
  reject_unknown_fields(
    payload,
    ["schema", "bokeh_version", "source", "roots", "requires", "metadata"],
    "embed payload",
  )
  if (source.kind != "standalone" && source.kind != "server") {
    throw new EmbedError("schema", "payload.source.kind must be 'standalone' or 'server'")
  }
  as_string(payload.bokeh_version, "payload.bokeh_version")
  if (source.kind == "standalone") {
    reject_unknown_fields(source, ["kind", "documents"], "standalone embed source")
    if (!Array.isArray(source.documents) || source.documents.length != 1) {
      throw new EmbedError("schema", "standalone payload.source.documents must contain exactly one document")
    }
    if (source.documents.some((document) => !isPlainObject(document))) {
      throw new EmbedError("schema", "standalone embed documents must be objects")
    }
  } else {
    reject_unknown_fields(
      source,
      ["kind", "url", "session_id", "token", "arguments", "headers", "credentials", "relative_urls"],
      "server embed source",
    )
    validate_server_url(source.url)
    if (source.credentials != null && !["omit", "same-origin", "include"].includes(`${source.credentials}`)) {
      throw new EmbedError("schema", "server embed credentials must be 'omit', 'same-origin', or 'include'")
    }
    for (const field of ["arguments", "headers"] as const) {
      if (source[field] != null) {
        const entries = Object.entries(as_record(source[field], `server embed source.${field}`))
        if (entries.some(([, item]) => typeof item != "string")) {
          throw new EmbedError("schema", `server embed source.${field} values must be strings`)
        }
      }
    }
    for (const field of ["session_id", "token"] as const) {
      if (source[field] != null) {
        as_string(source[field], `server embed source.${field}`)
      }
    }
    if (source.session_id != null && source.token != null) {
      throw new EmbedError("schema", "server embed source accepts either session_id or token, not both")
    }
    if (source.relative_urls != null && typeof source.relative_urls != "boolean") {
      throw new EmbedError("schema", "server embed source.relative_urls must be a boolean")
    }
  }
  if (!Array.isArray(payload.roots)) {
    throw new EmbedError("schema", "payload.roots must be an array")
  }
  const keys = new Set<string>()
  for (const root of payload.roots) {
    const descriptor = as_record(root, "embed root")
    const key = as_string(descriptor.key, "embed root key")
    if (keys.has(key)) {
      throw new EmbedError("schema", `duplicate embed root key '${key}'`)
    }
    keys.add(key)
    if (source.kind == "standalone") {
      if ("model_id" in descriptor) {
        throw new EmbedError("schema", `standalone root '${key}' cannot declare model_id`)
      }
      reject_unknown_fields(descriptor, ["key", "document", "root"], "standalone embed root")
      if (!Number.isInteger(descriptor.document) || !Number.isInteger(descriptor.root) ||
          (descriptor.document as number) < 0 || (descriptor.root as number) < 0) {
        throw new EmbedError("schema", `standalone root '${key}' requires non-negative integer document/root ordinals`)
      }
      if (descriptor.document != 0) {
        throw new EmbedError("schema", `standalone root '${key}' refers to missing document ${descriptor.document}`)
      }
      const document = (source.documents as unknown[])[0] as {[key: string]: unknown}
      if (!Array.isArray(document.roots) || (descriptor.root as number) >= document.roots.length) {
        throw new EmbedError("schema", `standalone root '${key}' refers to missing root ${descriptor.root}`)
      }
    } else {
      if ("document" in descriptor || "root" in descriptor) {
        throw new EmbedError("schema", `server root '${key}' cannot declare document/root ordinals`)
      }
      reject_unknown_fields(descriptor, ["key", "model_id"], "server embed root")
      as_string(descriptor.model_id, `server root '${key}' model_id`)
    }
  }
  const addresses = source.kind == "standalone"
    ? (payload.roots as StructuralEmbedRoot[]).map(({document, root}) => `${document}:${root}`)
    : (payload.roots as ServerEmbedRoot[]).map(({model_id}) => model_id)
  if (new Set(addresses).size != addresses.length) {
    throw new EmbedError("schema", "embed roots must identify unique models")
  }
  validate_resource_requirements(payload.requires, "payload.requires")
  as_record(payload.metadata, "payload.metadata")
  validate_json_value(payload, "embed payload")
  return payload as EmbedPayload
}

/**
 * Validate, satisfy resources, and decode an embed payload for mounting.
 * The caller assumes ownership of the returned document, session, and release hook.
 */
export async function prepare_embed(value: unknown, policy: ResourcePolicy = "none",
    resolver?: ModelResolver, signal?: AbortSignal,
    server_policy: ResourcePolicy = policy): Promise<PreparedEmbed> {
  const payload = validate_embed_payload(value)
  if (payload.source.kind == "server") {
    if (signal?.aborted == true) {
      throw signal.reason
    }
    return prepare_server(payload, policy, server_policy, signal)
  }
  try {
    await resource_loader.ensure(payload.requires, policy, payload.bokeh_version, signal)
  } catch (error) {
    if (error instanceof ResourceError) {
      throw new EmbedError(
        "resource", error.message, error, "resource", {kind: "embed"},
      )
    }
    throw error
  }
  if (signal?.aborted == true) {
    throw signal.reason
  }
  return prepare_standalone(payload, resolver)
}

function prepare_standalone(payload: EmbedPayload, resolver?: ModelResolver): PreparedEmbed {
  const {documents} = payload.source as StandaloneEmbedSource
  if (!Array.isArray(documents) || documents.length != 1) {
    throw new EmbedError(
      "schema", "Bokeh embed payloads currently normalize standalone input to exactly one document; split independent documents",
    )
  }
  const document = (() => {
    try {
      return Document.from_json(documents[0], {resolver})
    } catch (error) {
      throw new EmbedError(
        "decode", `failed to decode standalone Bokeh embed payload: ${error}`, error,
        "deserialize", {kind: "embed"},
      )
    }
  })()
  try {
    const roots = new Map<string, HasProps>()
    for (const descriptor of payload.roots as StructuralEmbedRoot[]) {
      if (descriptor.document != 0) {
        throw new EmbedError("schema", `embed root '${descriptor.key}' refers to missing document ${descriptor.document}`)
      }
      const document_roots = document.roots()
      if (descriptor.root < 0 || descriptor.root >= document_roots.length) {
        throw new EmbedError("schema", `embed root '${descriptor.key}' refers to missing root ${descriptor.root}`)
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

function current_server_url(): string {
  // A srcdoc frame can carry the public application URL despite its about location.
  try {
    const frame = window.frameElement
    if (frame?.tagName.toUpperCase() == "IFRAME") {
      const absolute_url = frame.getAttribute("data-absolute-url")
      if (absolute_url != null) {
        return absolute_url
      }
    }
  } catch {
    // Cross-origin hosts may prevent access to the containing frame.
  }
  return window.location.href
}

async function prepare_server(payload: EmbedPayload, initial_policy: ResourcePolicy,
    policy: ResourcePolicy, signal?: AbortSignal): Promise<PreparedEmbed> {
  const source = payload.source as ServerEmbedSource
  const configured_app = new URL(source.url == "." ? current_server_url() : source.url, document.baseURI)
  if (configured_app.protocol != "http:" && configured_app.protocol != "https:") {
    throw new EmbedError("schema", "server embed application URL must use HTTP(S)")
  }
  const app = source.relative_urls == true
    ? new URL(`${configured_app.pathname}${configured_app.search}`, document.baseURI)
    : configured_app
  const token = await (async () => {
    const endpoint = new URL(app.href)
    endpoint.pathname = `${app.pathname.replace(/\/$/, "")}/embed.json`
    endpoint.search = ""
    for (const [key, value] of Object.entries(source.arguments ?? {})) {
      if (!key.startsWith("bokeh-")) {
        endpoint.searchParams.append(key, value)
      }
    }
    const headers = new Headers(source.headers ?? {})
    if (source.token != null) {
      headers.set("Bokeh-Token", source.token)
    } else if (source.session_id != null) {
      headers.set("Bokeh-Session-Id", source.session_id)
    }
    const requested_policy = typeof policy == "string" ? {mode: policy} : policy
    const host_assets = typeof policy == "string" ? undefined : policy.assets
    const requested_mode = host_assets != null
      ? "none"
      : requested_policy.mode == "auto"
        ? "cdn"
        : requested_policy.mode == "resolved" ? "none" : requested_policy.mode
    headers.set("Bokeh-Resource-Mode", requested_mode)
    if (requested_policy.minified != null) {
      headers.set("Bokeh-Resource-Minified", `${requested_policy.minified}`)
    }
    const response = await (async () => {
      try {
        return await fetch(endpoint, {headers, credentials: source.credentials ?? "same-origin", signal})
      } catch (error) {
        throw new EmbedError(
          "http", `failed to request Bokeh server embed payload from ${endpoint}: ${error}`, error,
          "payload", {kind: "embed", url: endpoint.href},
        )
      }
    })()
    if (!response.ok) {
      throw new EmbedError(
        "http", `Bokeh server embed payload request failed: ${response.status} ${response.statusText}`,
        response, "payload", {kind: "embed", url: endpoint.href},
      )
    }
    let bootstrap_data: unknown
    try {
      bootstrap_data = await response.json()
    } catch (error) {
      if (signal?.aborted == true) {
        throw signal.reason
      }
      throw new EmbedError(
        "decode", `failed to decode Bokeh server embed payload from ${endpoint}: ${error}`, error,
        "payload", {kind: "embed", url: endpoint.href},
      )
    }
    const bootstrap = as_record(bootstrap_data, "Bokeh server bootstrap")
    if (bootstrap.schema != "bokeh.embed-server/v1") {
      throw new EmbedError(
        "schema", `unsupported Bokeh server bootstrap schema '${bootstrap.schema}'; expected 'bokeh.embed-server/v1'`,
        undefined, "schema", {kind: "embed", url: endpoint.href},
      )
    }
    const server_version = as_string(bootstrap.bokeh_version, "Bokeh server bootstrap bokeh_version")
    reject_unknown_fields(
      bootstrap, ["schema", "bokeh_version", "token", "requires", "resources"], "Bokeh server bootstrap",
    )
    const token = as_string(bootstrap.token, "Bokeh server bootstrap token")
    const requires = validate_resource_requirements(
      bootstrap.requires, "Bokeh server bootstrap requires",
    )
    const resources = as_record(bootstrap.resources, "Bokeh server bootstrap resources")
    reject_unknown_fields(resources, ["mode", "assets", "root_url"], "Bokeh server bootstrap resources")
    if (resources.mode != "resolved") {
      throw new EmbedError("schema", "Bokeh server bootstrap resources.mode must be 'resolved'")
    }
    const assets = validate_resolved_assets(resources.assets)
    const resource_root_url = resources.root_url == null
      ? app.href
      : new URL(validate_server_url(resources.root_url), app).href
    const asset_base = resources.root_url == null ? app : `${resource_root_url.replace(/\/$/, "")}/`
    const host_policy = typeof policy == "string" ? undefined : policy
    const resolved_policy: ResourcePolicy = {
      mode: "resolved",
      override_version: host_policy?.override_version,
      assets: (host_policy?.assets ?? assets).map((asset) => ({
        ...asset,
        ...(host_policy?.assets == null && asset.url != null ? {url: new URL(asset.url, asset_base).href} : {}),
        ...(host_policy?.nonce != null ? {nonce: host_policy.nonce} : {}),
        ...(asset.crossorigin == null && host_policy?.crossorigin != null
          ? {crossorigin: host_policy.crossorigin}
          : {}),
      })),
      integrity: host_policy?.integrity,
      external_only: host_policy?.external_only,
      retry: host_policy?.retry,
    }
    try {
      // Bootstrap owns the live document's version and public server asset prefix.
      const component_policy = typeof initial_policy == "string" ? {mode: initial_policy} : initial_policy
      const component_mode = component_policy.assets == null &&
          (component_policy.mode == "relative" || component_policy.mode == "absolute")
        ? "server" : component_policy.mode
      await resource_loader.ensure({
        components: [...new Set([...payload.requires.components, ...requires.components])], extensions: [],
      }, {
        ...component_policy,
        mode: component_mode,
        override_version: component_policy.override_version ?? host_policy?.override_version,
        root_url: component_policy.root_url ?? resource_root_url,
      }, server_version, signal)
      await resource_loader.ensure(requires, resolved_policy, server_version, signal)
    } catch (error) {
      if (error instanceof ResourceError) {
        throw new EmbedError(
          "resource", error.message, error, "resource", {kind: "embed", url: endpoint.href},
        )
      }
      throw error
    }
    return token
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
      throw new EmbedError(
        "websocket", `failed to open Bokeh server session at ${websocket_url}: ${error}`, error,
        "session", {kind: "embed", url: websocket_url},
      )
    }
  })()

  try {
    const roots = new Map<string, HasProps>()
    const document_roots = session.document.roots()
    const full_document = isPlainObject(payload.metadata.embedding) &&
      payload.metadata.embedding.full_document === true
    if (payload.roots.length == 0 && !full_document) {
      for (const [index, root] of document_roots.entries()) {
        roots.set(document_roots.length == 1 ? "root" : `root-${index}`, root)
      }
    } else {
      for (const descriptor of payload.roots as ServerEmbedRoot[]) {
        const root = session.document.get_model_by_id(descriptor.model_id)
        if (root == null || !document_roots.includes(root)) {
          if (full_document) {
            continue
          }
          throw new EmbedError(
            "session", `server embed root '${descriptor.key}' does not identify a document root`,
          )
        }
        roots.set(descriptor.key, root)
      }
      if (full_document) {
        const selected = new Set(roots.values())
        for (const root of document_roots) {
          if (selected.has(root)) {
            continue
          }
          let key: string = root.id
          let suffix = 1
          while (roots.has(key)) {
            key = `${root.id}-${suffix++}`
          }
          roots.set(key, root)
        }
      }
    }
    return {
      document: session.document,
      roots,
      document_ownership: "mount",
      track_document_roots: payload.roots.length == 0 || full_document,
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
