import {Document} from "../document"
import {StandaloneMount, StandaloneRootError} from "../embed/standalone"
import type {EmbedTarget} from "../embed/standalone"

import type {ViewOf} from "core/view"
import type {ViewLookup} from "core/view_manager"
export type {ViewLookup} from "core/view_manager"
import {HasProps} from "core/has_props"
import type {ModelResolver} from "core/resolvers"
import {dom_ready, contains} from "core/dom"
import {logger} from "core/logging"
import {isArray, isPlainObject, isString} from "core/util/types"

import type {UIElement} from "models/ui/ui_element"
import type {DOMNode} from "models/dom/dom_node"
import type {ClientSession} from "../client/session"
import type {EmbedPayload, PreparedEmbed} from "../embed/payload"
import {EmbedError, prepare_embed, validate_embed_payload} from "../embed/payload"
import type {ResourcePolicy} from "../embed/resources"

declare type Jq = any
declare const $: Jq

export type ShowableRoot = UIElement | DOMNode
export type Showable = ShowableRoot | readonly ShowableRoot[]

/** Stable caller-defined address for one root within a mount. */
export type RootKey = string
/** Caller-owned DOM destination, provided directly or by selector. */
export type MountTarget = EmbedTarget | string
/** Models addressed by logical root key. A model may appear under only one key. */
export type KeyedRoots<T extends HasProps = HasProps> = ReadonlyMap<RootKey, T> | Readonly<Record<RootKey, T>>
/** Per-root destinations. Missing or null entries keep that root detached. */
export type KeyedMountTargets = ReadonlyMap<RootKey, MountTarget | null> | Readonly<Record<RootKey, MountTarget | null>>
/** One shared destination or destinations addressed by logical root key. */
export type MountTargets = MountTarget | KeyedMountTargets
/** Whether the caller or mount must destroy the source document. */
export type DocumentOwnership = "caller" | "mount"

/** Resources whose cleanup is assigned to a mount handle. */
export type MountOwnership = {
  readonly document: DocumentOwnership
  readonly views: "mount"
  readonly targets: "caller"
  readonly session: "mount" | "none"
  readonly resources: "shared" | "none"
}

/**
 * A decoded runtime source for one document and its addressable logical roots.
 *
 * Sources built from an existing document are caller-owned. Sources built from
 * unattached roots create a temporary document which the resulting mount owns.
 */
export class MountSource<T extends HasProps = HasProps> {
  readonly roots: ReadonlyMap<RootKey, T>

  constructor(
    readonly document: Document,
    roots: KeyedRoots<T>,
    readonly document_ownership: DocumentOwnership = "caller",
    readonly track_document_roots: boolean = false,
  ) {
    const entries = keyed_entries(roots)
    const models = new Set<T>()
    const normalized = new Map<RootKey, T>()
    for (const [key, model] of entries) {
      if (key.length == 0) {
        throw new MountError("source", "Bokeh mount root keys must not be empty")
      }
      if (!(model instanceof HasProps)) {
        throw new MountError("source", `Bokeh mount root '${key}' is not a model`)
      }
      if (models.has(model)) {
        throw new MountError("source", `Bokeh model ${model} is assigned to more than one mount root`)
      }
      if (model.document != document || !document.roots().includes(model)) {
        throw new MountError("source", `Bokeh mount root '${key}' is not a root of its source document`)
      }
      models.add(model)
      normalized.set(key, model)
    }
    this.roots = normalized
  }

  static from_document(document: Document): MountSource<HasProps> {
    return new MountSource(document, keyed_by_id(document.roots()), "caller", true)
  }

  static from_roots<T extends HasProps>(roots: T | readonly T[] | KeyedRoots<T>): MountSource<T> {
    const keyed: KeyedRoots<T> = roots instanceof HasProps
      ? keyed_by_id<T>([roots])
      : isArray(roots)
        ? keyed_by_id<T>(roots as T[])
        : roots as KeyedRoots<T>
    const entries = keyed_entries(keyed)
    const models = entries.map(([, model]) => model)
    const source_documents = new Set(models.map((model) => model.document).filter((doc): doc is Document => doc != null))
    const has_unowned_models = models.some((model) => model.document == null)

    if (source_documents.size > 1 || (source_documents.size == 1 && has_unowned_models)) {
      throw new MountError("source", "all Bokeh mount roots must belong to the same document or to no document")
    }

    const source_document = models.find((model) => model.document != null)?.document
    if (source_document != null) {
      return new MountSource<T>(source_document, keyed, "caller")
    }

    const document = new Document({roots: models})
    try {
      return new MountSource<T>(document, keyed, "mount")
    } catch (error) {
      document.destroy()
      throw error
    }
  }
}

/** Decoded content or an embed payload accepted by the core mount lifecycle. */
export type Mountable = MountSource | Document | EmbedPayload | ShowableRoot | readonly ShowableRoot[] | KeyedRoots<HasProps>

/** Phase-independent category for a structured mount failure. */
export type MountErrorKind =
  | "source"
  | "target"
  | "render"
  | "abort"
  | "disposed"
  | "schema"
  | "decode"
  | "resource"
  | "http"
  | "websocket"
  | "session"

/** Precise embed or mount phase in which a failure occurred. */
export type MountErrorPhase =
  | "bootstrap"
  | "payload"
  | "schema"
  | "fingerprint"
  | "resource"
  | "deserialize"
  | "session"
  | "target"
  | "render"
  | "abort"
  | "dispose"

/** Embed/declaration identity attached to an externally observable failure. */
export type MountErrorSource = {
  readonly kind: "embed-declaration" | "embed" | "mount"
  readonly embed?: string
  readonly url?: string
}

/** Error reported by mount readiness, mutation, discovery, or disposal. */
export class MountError extends Error {
  override readonly name = "BokehMountError"

  constructor(
    readonly kind: MountErrorKind,
    message: string,
    override readonly cause?: unknown,
    readonly root_key?: RootKey,
    readonly phase?: MountErrorPhase,
    readonly source?: MountErrorSource,
  ) {
    super(message)
  }
}

/** Observable lifecycle state of a `BokehMount`. */
export type MountState = "pending" | "ready" | "failed" | "disposed"

/** Caller choices for cancellation, resource loading, page-title use, and error observation. */
export type MountOptions = {
  /** Cancels pending work and disposes work already owned by the mount. */
  signal?: AbortSignal
  /** Allow the mounted document to update the browser page title. */
  use_for_title?: boolean
  /** Embed resource policy. Direct model/document mounts ignore this option. */
  resources?: ResourcePolicy
  /** Model resolver used while decoding embed documents. */
  resolver?: ModelResolver
  /** Called for every structured failure before the same error rejects an operation. */
  on_error?(error: MountError): void
}

/** Cancellation options for target-local mount discovery. */
export type WhenMountedOptions = {
  signal?: AbortSignal
}

export const BOKEH_MOUNTED_EVENT = "bokeh:mounted"
export const BOKEH_MOUNT_ERROR_EVENT = "bokeh:mount-error"
export const BOKEH_MOUNTED_ATTRIBUTE = "data-bokeh-mounted"

declare global {
  interface HTMLElement {
    bokehMount?: BokehMount
    bokehMountError?: MountError
  }

  interface DocumentFragment {
    bokehMount?: BokehMount
    bokehMountError?: MountError
  }
}

function publish_mount(target: EmbedTarget, mounted: BokehMount): void {
  const changed = target.bokehMount != mounted
  target.bokehMount = mounted
  delete target.bokehMountError
  if (target instanceof HTMLElement) {
    target.setAttribute(BOKEH_MOUNTED_ATTRIBUTE, "")
  }
  if (changed) {
    target.dispatchEvent(new CustomEvent(BOKEH_MOUNTED_EVENT, {detail: mounted}))
  }
}

function clear_mount_error(target: EmbedTarget): void {
  delete target.bokehMountError
}

function is_embed_target(target: unknown): target is EmbedTarget {
  return target instanceof HTMLElement || target instanceof DocumentFragment
}

function is_mount_target(target: MountTargets): target is MountTarget {
  return isString(target) || is_embed_target(target)
}

/** Publish a structured failure when a bootstrap cannot create a mount handle. */
export function publish_mount_error(target: EmbedTarget, error: MountError): void {
  if (target.bokehMount != null) {
    return
  }
  target.bokehMountError = error
  if (target instanceof HTMLElement) {
    target.removeAttribute(BOKEH_MOUNTED_ATTRIBUTE)
  }
  target.dispatchEvent(new CustomEvent(BOKEH_MOUNT_ERROR_EVENT, {detail: error}))
}

function unpublish_mount(target: EmbedTarget, mounted: BokehMount, error?: MountError): void {
  if (target.bokehMount != mounted) {
    return
  }
  delete target.bokehMount
  delete target.bokehMountError
  if (target instanceof HTMLElement) {
    target.removeAttribute(BOKEH_MOUNTED_ATTRIBUTE)
  }
  if (error != null) {
    publish_mount_error(target, error)
  }
}

/** Wait for the mount handle published by the bootstrap that owns this target. */
export function when_mounted(target: EmbedTarget, options: WhenMountedOptions = {}): Promise<BokehMount> {
  if (target.bokehMount != null) {
    return Promise.resolve(target.bokehMount)
  }
  if (target.bokehMountError != null) {
    return Promise.reject(target.bokehMountError)
  }

  const {signal} = options
  if (signal?.aborted == true) {
    return Promise.reject(mount_error("abort", signal.reason))
  }

  return new Promise<BokehMount>((resolve, reject) => {
    const cleanup = () => {
      target.removeEventListener(BOKEH_MOUNTED_EVENT, on_mounted)
      target.removeEventListener(BOKEH_MOUNT_ERROR_EVENT, on_error)
      signal?.removeEventListener("abort", on_abort)
    }
    const on_mounted = () => {
      const mounted = target.bokehMount
      if (mounted != null) {
        cleanup()
        resolve(mounted)
      }
    }
    const on_error = () => {
      const error = target.bokehMountError
      if (error != null && target.bokehMount == null) {
        cleanup()
        reject(error)
      }
    }
    const on_abort = () => {
      cleanup()
      reject(mount_error("abort", signal?.reason))
    }

    target.addEventListener(BOKEH_MOUNTED_EVENT, on_mounted)
    target.addEventListener(BOKEH_MOUNT_ERROR_EVENT, on_error)
    signal?.addEventListener("abort", on_abort, {once: true})

    // Defend against publication from re-entrant event instrumentation.
    on_mounted()
    on_error()
  })
}

function keyed_entries<T>(values: ReadonlyMap<string, T> | Readonly<Record<string, T>>): [string, T][] {
  return values instanceof Map ? [...values] : Object.entries(values)
}

function keyed_by_id<T extends HasProps>(models: readonly T[]): Map<string, T> {
  const result = new Map<string, T>()
  for (const model of models) {
    if (result.has(model.id)) {
      throw new MountError("source", `duplicate Bokeh mount root key '${model.id}'`)
    }
    result.set(model.id, model)
  }
  return result
}

function as_mount_source(source: Mountable): MountSource {
  if (source instanceof MountSource) {
    return source
  } else if (source instanceof Document) {
    return MountSource.from_document(source)
  } else if (source instanceof HasProps || isArray(source) || source instanceof Map || isPlainObject(source)) {
    return MountSource.from_roots<HasProps>(source as HasProps | readonly HasProps[] | KeyedRoots<HasProps>)
  } else {
    throw new MountError("source", "mount source must be a Bokeh model, root collection, Document, or MountSource")
  }
}

function mount_error(kind: MountErrorKind, error: unknown, root_key?: RootKey): MountError {
  if (error instanceof MountError) {
    return error
  } else if (error instanceof StandaloneRootError) {
    return mount_error(kind, error.cause, error.root_key)
  } else if (error instanceof EmbedError) {
    return new MountError(error.kind, error.message, error, root_key, error.phase, error.source)
  }
  const message = error instanceof Error ? error.message : `${error}`
  return new MountError(kind, message, error, root_key)
}

async function resolve_target(target: MountTarget | undefined, script: HTMLScriptElement | SVGScriptElement | null): Promise<EmbedTarget> {
  await dom_ready()

  let resolved: unknown = target
  if (target == null) {
    if (script != null && contains(document.body, script)) {
      const parent = script.parentNode
      if (parent instanceof HTMLElement || parent instanceof DocumentFragment) {
        resolved = parent
      }
    }
    resolved ??= document.body
  } else if (isString(target)) {
    const found = document.querySelector(target)
    if (found instanceof HTMLElement) {
      resolved = found.shadowRoot ?? found
    } else {
      throw new Error(`'${target}' selector didn't match an HTMLElement`)
    }
  } else if (typeof $ !== "undefined" && (target as any) instanceof $) {
    resolved = (target as Jq)[0]
  }

  if (resolved instanceof HTMLElement) {
    if (!resolved.isConnected) {
      throw new Error("Bokeh mount targets must be connected HTMLElements")
    }
    return resolved
  } else if (resolved instanceof DocumentFragment) {
    return resolved
  } else {
    throw new Error("target should be a connected HTMLElement, DocumentFragment, string selector, $ or null")
  }
}

/**
 * Owning lifecycle handle for Bokeh content attached to caller-owned targets.
 *
 * The handle is returned immediately. Await `ready` before reading views or
 * changing attachments. `dispose()` is idempotent and releases every resource
 * listed by `ownership`. `when_disposed` also resolves after initialization
 * failure or early cancellation.
 */
export class BokehMount<T extends HasProps = HasProps> {
  private _state: MountState = "pending"
  private _error: MountError | null = null
  private readonly _errors: MountError[] = []
  private readonly _suppressed_roots = new Set<RootKey>()
  private readonly _published_targets = new Set<EmbedTarget>()
  private readonly _on_abort = () => this._abort(this.signal?.reason)
  private _resolve_disposed!: () => void

  /** Resolves when initial roots are attached. Rejects with `MountError` on failure. */
  readonly ready: Promise<void>
  /** Resolves after cleanup for success, failure, cancellation, or explicit disposal. */
  readonly when_disposed: Promise<void>
  private readonly _embed_payload: boolean

  constructor(
    source: MountSource<T> | Promise<PreparedEmbed>,
    targets: MountTargets | undefined,
    private readonly _options: MountOptions,
    script: HTMLScriptElement | SVGScriptElement | null,
  ) {
    if (targets != null && is_mount_target(targets)) {
      if (is_embed_target(targets)) {
        clear_mount_error(targets)
      }
    } else if (targets != null) {
      for (const [, configured_target] of keyed_entries(targets)) {
        if (is_embed_target(configured_target)) {
          clear_mount_error(configured_target)
        }
      }
    }

    this._embed_payload = !(source instanceof MountSource)
    this.when_disposed = new Promise<void>((resolve) => this._resolve_disposed = resolve)
    if (source instanceof MountSource) {
      this._set_source(source)
    }

    const {signal} = _options
    if (signal?.aborted == true) {
      this._abort(signal.reason)
    } else {
      signal?.addEventListener("abort", this._on_abort, {once: true})
    }

    this.ready = this._initialize(source, targets, script)
    void this.ready.catch(() => {})
  }

  private _source: MountSource<T> | null = null
  private _mount: StandaloneMount | null = null
  private _session: ClientSession | null = null
  private _release: (() => void) | null = null

  private get _required_mount(): StandaloneMount {
    if (this._mount == null) {
      throw new MountError("source", "the Bokeh mount is not available before source preparation completes")
    }
    return this._mount
  }

  /** Exact document/view/target/session/resource responsibilities for this handle. */
  get ownership(): MountOwnership {
    return {
      document: this._source?.document_ownership ?? "mount",
      views: "mount",
      targets: "caller",
      session: this._session == null ? "none" : "mount",
      resources: this._embed_payload ? "shared" : "none",
    }
  }

  private _set_source(source: MountSource<T>, prepared?: PreparedEmbed): void {
    this._source = source
    this._session = prepared?.session ?? null
    this._release = prepared?.release ?? null
    this._mount = new StandaloneMount(
      source.document,
      new Map(source.roots),
      source.document_ownership == "mount",
      undefined,
      (error, root_key) => this._record_error(mount_error("render", error, root_key)),
      source.track_document_roots,
      () => {
        if (this._state == "ready") {
          this._sync_published_targets()
        }
      },
    )
  }

  /** Source document shared by every keyed root. */
  get document(): Document {
    if (this._source == null) {
      throw new MountError("source", "the Bokeh embed document is not available before mount readiness")
    }
    return this._source.document
  }

  /** Server session owned by an embed mount, or null for standalone content. */
  get session(): ClientSession | null {
    return this._session
  }

  /** Logical root keys in deterministic source order. */
  get root_keys(): readonly RootKey[] {
    return this._required_mount.root_keys
  }

  get roots(): ReadonlyMap<RootKey, T> {
    return this._required_mount.roots as unknown as ReadonlyMap<RootKey, T>
  }

  get models(): readonly T[] {
    return [...this.roots.values()]
  }

  get views(): ViewOf<T>[] {
    return this.root_keys.map((key) => this.view(key)).filter((view) => view != null)
  }

  get targets(): ReadonlyMap<RootKey, EmbedTarget> {
    return this._required_mount.targets
  }

  get view_lookup(): ViewLookup {
    return this._required_mount.views
  }

  /** Return a source root by logical key, independently of attachment state. */
  root(key: RootKey): T | null {
    return this._required_mount.root(key) as T | null
  }

  /** Return the currently attached root view, or null while detached. */
  view(key: RootKey): ViewOf<T> | null {
    return this._required_mount.view(key) as ViewOf<T> | null
  }

  /** Return the caller-owned target currently associated with a root. */
  target(key: RootKey): EmbedTarget | null {
    return this._required_mount.target(key)
  }

  get state(): MountState {
    return this._state
  }

  get error(): MountError | null {
    return this._error
  }

  /** Target and render failures reported by this handle. Caller-driven cancellation is excluded. */
  get errors(): readonly MountError[] {
    return this._errors
  }

  get disposed(): boolean {
    return this._state == "disposed" || this._state == "failed" || this._mount?.disposed == true
  }

  private get signal(): AbortSignal | undefined {
    return this._options.signal
  }

  private _record_error(error: MountError): void {
    this._error = error
    this._errors.push(error)
    try {
      this._options.on_error?.(error)
    } catch (callback_error) {
      logger.error(`Bokeh mount error callback failed: ${callback_error}`)
    }
  }

  private _check_pending(): void {
    if (this._state == "disposed") {
      throw this._error ?? new MountError("disposed", "Bokeh mount was disposed before becoming ready")
    }
  }

  private _publish_target(target: EmbedTarget): void {
    this._published_targets.add(target)
    publish_mount(target, this)
  }

  private _unpublish_target(target: EmbedTarget, error?: MountError): void {
    this._published_targets.delete(target)
    unpublish_mount(target, this, error)
  }

  private _unpublish_all(error?: MountError): void {
    for (const target of [...this._published_targets]) {
      this._unpublish_target(target, error)
    }
  }

  private _sync_published_targets(): void {
    if (this._mount == null) {
      return
    }
    const attached = new Set(this._mount.targets.values())
    for (const target of attached) {
      if (!this._published_targets.has(target)) {
        this._publish_target(target)
      }
    }
    for (const target of [...this._published_targets]) {
      if (!attached.has(target)) {
        this._unpublish_target(target)
      }
    }
  }

  private async _initialize(source: MountSource<T> | Promise<PreparedEmbed>, configured_targets: MountTargets | undefined,
      script: HTMLScriptElement | SVGScriptElement | null): Promise<void> {
    try {
      this._check_pending()
      if (!(source instanceof MountSource)) {
        const prepared = await source
        if (this._state == "disposed") {
          prepared.release()
          prepared.document.destroy()
          this._check_pending()
        }
        const normalized = new MountSource(
          prepared.document,
          prepared.roots,
          prepared.document_ownership,
          prepared.track_document_roots,
        ) as MountSource<T>
        this._set_source(normalized, prepared)
      }
      const mount = this._required_mount
      const targets = new Map<RootKey, EmbedTarget>()

      const shared_target = await (async () => {
        try {
          const shared_target = configured_targets == null || is_mount_target(configured_targets)
            ? await resolve_target(configured_targets, script)
            : null
          if (configured_targets != null && !is_mount_target(configured_targets)) {
            for (const [key, configured] of keyed_entries(configured_targets)) {
              if (!this.roots.has(key)) {
                throw new MountError("target", `unknown Bokeh mount root '${key}'`, undefined, key)
              }
              if (configured != null && !this._suppressed_roots.has(key)) {
                try {
                  targets.set(key, await resolve_target(configured, null))
                } catch (error) {
                  throw mount_error("target", error, key)
                }
              }
            }
          }
          return shared_target
        } catch (error) {
          throw mount_error("target", error)
        }
      })()

      this._check_pending()
      for (const key of this._suppressed_roots) {
        targets.delete(key)
      }
      for (const key of this.root_keys) {
        if (!this._suppressed_roots.has(key)) {
          const planned_target = targets.get(key) ?? shared_target
          if (planned_target != null) {
            this._publish_target(planned_target)
          }
        }
      }

      await mount.initialize(shared_target, targets, this._options.use_for_title)
      this._check_pending()
      this._state = "ready"
      this._sync_published_targets()
    } catch (error) {
      const mounted_error = mount_error("render", error)
      if (this._state != "disposed") {
        this._state = "failed"
        this._record_error(mounted_error)
        this._mount?.dispose()
        this._release?.()
        this._release = null
        this._unpublish_all(mounted_error)
        this._resolve_disposed()
      }
      throw this._error ?? mounted_error
    }
  }

  /** Attach or move one root after readiness without replacing the mount handle. */
  async attach(key: RootKey, target: MountTarget): Promise<ViewOf<T> | null> {
    this._suppressed_roots.delete(key)
    await this.ready
    let resolved: EmbedTarget
    try {
      resolved = await resolve_target(target, null)
    } catch (error) {
      const mounted_error = mount_error("target", error, key)
      this._record_error(mounted_error)
      throw mounted_error
    }

    try {
      return await this._required_mount.attach(key, resolved) as ViewOf<T> | null
    } catch (error) {
      const mounted_error = mount_error("render", error, key)
      this._record_error(mounted_error)
      throw mounted_error
    }
  }

  /** Alias for `attach()` emphasizing replacement of a root's current target. */
  replace_target(key: RootKey, target: MountTarget): Promise<ViewOf<T> | null> {
    return this.attach(key, target)
  }

  /** Remove one root view while preserving its model, document, and sibling roots. */
  detach(key: RootKey): void {
    if (this._state == "pending" && this._mount == null) {
      this._suppressed_roots.add(key)
      return
    }
    if (!this.roots.has(key)) {
      throw new MountError("source", `unknown Bokeh mount root '${key}'`, undefined, key)
    }
    this._suppressed_roots.add(key)
    this._required_mount.detach(key)
  }

  private _abort(reason: unknown): void {
    if (this._state == "disposed" || this._state == "failed") {
      return
    }
    this._error = new MountError("abort", reason instanceof Error ? reason.message : "Bokeh mount was aborted", reason)
    this._unpublish_all(this._error)
    void this.dispose()
  }

  /** Release owned views and documents and remove every target publication. */
  dispose(): Promise<void> {
    if (this._state == "disposed") {
      return this.when_disposed
    }
    if (this._state == "pending" && this._error == null) {
      this._error = new MountError("disposed", "Bokeh mount was disposed before becoming ready")
    }
    this.signal?.removeEventListener("abort", this._on_abort)
    this._mount?.dispose()
    this._release?.()
    this._release = null
    this._unpublish_all()
    if (this._state != "failed") {
      this._state = "disposed"
    }
    this._resolve_disposed()
    return this.when_disposed
  }
}

/**
 * Establish an owned relationship between decoded Bokeh content and DOM targets.
 * Returns the handle immediately. Await `handle.ready` for completed rendering.
 */
export function mount<T extends ShowableRoot>(
  source: T | readonly T[] | KeyedRoots<T>, targets?: MountTargets, options?: MountOptions,
): BokehMount<T>
export function mount<T extends HasProps>(
  source: MountSource<T>, targets?: MountTargets, options?: MountOptions,
): BokehMount<T>
export function mount(source: Document | EmbedPayload, targets?: MountTargets, options?: MountOptions): BokehMount<HasProps>
export function mount(source: Mountable, targets?: MountTargets, options?: MountOptions): BokehMount

export function mount(source: Mountable, targets?: MountTargets, options: MountOptions = {}): BokehMount {
  const script = document.currentScript // This needs to be evaluated before any asynchronous target resolution.
  const embed_payload_like = isPlainObject(source) && typeof (source as {schema?: unknown}).schema == "string" &&
    (source as {schema: string}).schema.startsWith("bokeh.embed/")
  const normalized = embed_payload_like
    ? prepare_embed(source, options.resources, options.resolver, options.signal)
    : as_mount_source(source)
  return new BokehMount(normalized, targets, options, script)
}

export async function mount_embed_declaration(
  script: HTMLScriptElement | null = document.currentScript instanceof HTMLScriptElement ? document.currentScript : null,
  options: MountOptions = {},
): Promise<BokehMount> {
  if (script == null) {
    throw new MountError("source", "an embed declaration script is required", undefined, undefined, "bootstrap")
  }
  let source = declaration_source(script)
  let affected_targets = await declaration_targets(script)
  affected_targets.forEach(clear_mount_error)
  try {
    if (options.signal?.aborted == true) {
      throw new MountError(
        "abort", abort_message(options.signal.reason), options.signal.reason, undefined, "abort", source,
      )
    }

    const payload_url = script.dataset.bokehPayloadUrl
    const value = await (async () => {
      if (payload_url != null) {
        const response = await (async () => {
          try {
            return await fetch(payload_url, {signal: options.signal})
          } catch (error) {
            const reason = options.signal?.reason
            if (error instanceof DOMException && error.name == "AbortError" || reason === error) {
              throw new MountError("abort", abort_message(reason), error, undefined, "payload", source)
            }
            throw new MountError(
              "http", `failed to fetch Bokeh embed payload from ${payload_url}: ${error}`, error, undefined, "payload", source,
            )
          }
        })()
        if (!response.ok) {
          throw new MountError(
            "http", `Bokeh embed payload request failed: ${response.status} ${response.statusText}`,
            response, undefined, "payload", source,
          )
        }
        try {
          return await response.json()
        } catch (error) {
          throw new MountError(
            "decode", `failed to decode Bokeh embed payload from ${payload_url}: ${error}`, error, undefined, "payload", source,
          )
        }
      } else {
        const payload = script.previousElementSibling
        if (!(payload instanceof HTMLScriptElement) || payload.dataset.bokehEmbedPayload == null ||
            payload.dataset.bokehEmbedInstance != script.dataset.bokehEmbedInstance) {
          throw new MountError(
            "source", "an inline embed declaration must follow its matching JSON payload script",
            undefined, undefined, "payload", source,
          )
        }
        try {
          return JSON.parse(payload.textContent)
        } catch (error) {
          throw new MountError(
            "decode", `failed to decode inline Bokeh embed payload: ${error}`, error, undefined, "payload", source,
          )
        }
      }
    })()

    const payload = (() => {
      try {
        return validate_embed_payload(value)
      } catch (error) {
        throw declaration_error(error, source, "schema")
      }
    })()
    if (source.embed != null && source.embed != payload.fingerprint) {
      throw new MountError(
        "schema",
        `embed declaration fingerprint '${source.embed}' does not match payload '${payload.fingerprint}'`,
        undefined, undefined, "fingerprint", source,
      )
    }
    if (source.embed == null) {
      source = {...source, embed: payload.fingerprint}
      affected_targets = await declaration_targets(script)
      affected_targets.forEach(clear_mount_error)
    }

    const targets = new Map<RootKey, HTMLElement>()
    for (const root of payload.roots) {
      const target = affected_targets.find((candidate) => candidate.dataset.bokehRoot == root.key)
      if (target == null) {
        throw new MountError(
          "target", `missing declaration target for Bokeh embed root '${root.key}'`,
          undefined, root.key, "target", source,
        )
      }
      targets.set(root.key, target)
    }
    const server_default = payload.source.kind == "server" && payload.roots.length == 0
    const shared_target = server_default
      ? affected_targets.find((candidate) => candidate.dataset.bokehRoot == "*")
      : undefined
    if (server_default && shared_target == null) {
      throw new MountError(
        "target", "missing declaration target for Bokeh server embed", undefined, "*", "target", source,
      )
    }

    const handle = server_default
      ? mount(payload, shared_target, {resources: "none", ...options})
      : mount(payload, targets, {resources: "none", ...options})
    await handle.ready
    return handle
  } catch (error) {
    const mounted_error = declaration_error(error, source)
    affected_targets.forEach((target) => publish_mount_error(target, mounted_error))
    throw mounted_error
  }
}

function declaration_source(script: HTMLScriptElement): MountErrorSource {
  return {
    kind: "embed-declaration",
    embed: script.dataset.bokehEmbed,
    url: script.dataset.bokehPayloadUrl,
  }
}

async function declaration_targets(script: HTMLScriptElement): Promise<HTMLElement[]> {
  await dom_ready()
  const instance = script.dataset.bokehEmbedInstance
  if (instance == null || !/^[A-Za-z][A-Za-z0-9-]*$/.test(instance)) {
    return []
  }
  return [...document.querySelectorAll<HTMLElement>(
    `[data-bokeh-embed-instance="${instance}"][data-bokeh-root]`,
  )]
}

function declaration_error(error: unknown, source: MountErrorSource,
    phase: MountErrorPhase = "bootstrap"): MountError {
  const mounted_error = mount_error("source", error)
  if (mounted_error.source == source) {
    return mounted_error
  }
  return new MountError(
    mounted_error.kind, mounted_error.message, mounted_error, mounted_error.root_key,
    mounted_error.phase ?? phase, source,
  )
}

function abort_message(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Bokeh embed declaration was aborted"
}

export function show<T extends ShowableRoot>(obj: T, target?: MountTarget): BokehMount<T>
export function show<T extends ShowableRoot>(obj: readonly T[], target?: MountTarget): BokehMount<T>
export function show(obj: Document, target?: MountTarget): BokehMount<HasProps>

export function show(obj: Document | Showable, target?: MountTarget): BokehMount {
  if (obj instanceof Document) {
    return mount(MountSource.from_document(obj), target)
  }
  return mount(obj, target)
}
