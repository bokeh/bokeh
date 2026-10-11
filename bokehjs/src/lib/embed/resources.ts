import {version as js_version} from "../version"
import {is_equal} from "../core/util/eq"
import {unique_id} from "../core/util/string"
import {Version} from "../core/util/version"

/** BokehJS bundle capability that an embed payload may require. */
export type ResourceComponent =
  | "bokeh/core"
  | "bokeh/widgets"
  | "bokeh/tables"
  | "bokeh/webgl"
  | "bokeh/mathjax"
  | "bokeh/api"

/** Concrete external or inline script/style declaration. */
export type ResourceAsset = {
  kind: "script" | "style"
  url?: string
  content?: string
  /** Host-supplied digest used only as a compact identity for trusted inline content. */
  content_sha256?: string
  integrity?: string
  crossorigin?: string
  nonce?: string
  module?: boolean
}

export type ResourceRequirementAsset = Omit<ResourceAsset, "nonce" | "content_sha256"> & {package?: string}

/** Named extension and the assets it contributes. */
export type ExtensionRequirement = {
  name: string
  assets: ResourceRequirementAsset[]
}

/** Exact capabilities and extensions declared by an embed payload. */
export type ResourceRequirements = {
  components: ResourceComponent[]
  extensions: ExtensionRequirement[]
}

/** Supported host strategies for satisfying requirements. */
export type ResourcePolicyMode =
  | "none"
  | "auto"
  | "cdn"
  | "server"
  | "relative"
  | "absolute"
  | "inline"
  | "offline"
  | "resolved"

/** Host-owned resource resolution, security, and retry choices. */
export type ResourcePolicy = ResourcePolicyMode | {
  mode: ResourcePolicyMode
  /** Expected runtime version when deliberately trying a different BokehJS release. */
  override_version?: string
  minified?: boolean
  root_url?: string
  nonce?: string
  crossorigin?: string
  integrity?: boolean
  external_only?: boolean
  retry?: boolean
  /** Trusted, fully resolved assets supplied by the embed host. */
  assets?: ResourceAsset[]
}

/** Structured policy, conflict, load, or version failure. */
export class ResourceError extends Error {
  override readonly name = "BokehResourceError"

  constructor(
    readonly kind: "policy" | "conflict" | "load" | "version",
    message: string,
    override readonly cause?: unknown,
    readonly resource?: ResourceAsset,
  ) {
    super(message)
  }
}

type NormalizedPolicy = Exclude<ResourcePolicy, string> & {mode: ResourcePolicyMode}

const component_names: {[key in ResourceComponent]: string} = {
  "bokeh/core": "bokeh",
  "bokeh/widgets": "bokeh-widgets",
  "bokeh/tables": "bokeh-tables",
  "bokeh/webgl": "bokeh-gl",
  "bokeh/mathjax": "bokeh-mathjax",
  "bokeh/api": "bokeh-api",
}

const resource_policy_modes = new Set<ResourcePolicyMode>([
  "none", "auto", "cdn", "server", "relative", "absolute", "inline", "offline", "resolved",
])
const existing_resource_timeout = 5_000
const generated_resource_timeout = 30_000

function abort_reason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException("The operation was aborted", "AbortError")
}

function wait_with_signal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (signal == null) {
    return promise
  }
  if (signal.aborted) {
    return Promise.reject(abort_reason(signal))
  }
  return new Promise<T>((resolve, reject) => {
    const aborted = () => {
      cleanup()
      reject(abort_reason(signal))
    }
    const cleanup = () => signal.removeEventListener("abort", aborted)
    signal.addEventListener("abort", aborted, {once: true})
    promise.then(
      (value) => {
        cleanup()
        resolve(value)
      },
      (error) => {
        cleanup()
        reject(error)
      },
    )
  })
}

function normalize_policy(policy: ResourcePolicy = "none"): NormalizedPolicy {
  const normalized = typeof policy == "string" ? {mode: policy} : policy
  if (!resource_policy_modes.has(normalized.mode)) {
    throw new ResourceError("policy", `unknown Bokeh resource policy '${normalized.mode}'`)
  }
  return normalized
}

function normalized_url(url: string): string {
  const normalized = new URL(url, document.baseURI)
  if (normalized.protocol == "javascript:" || normalized.protocol == "data:" || normalized.protocol == "vbscript:") {
    throw new ResourceError("policy", `${normalized.protocol} URLs are not valid Bokeh resources`)
  }
  return normalized.href
}

function locator(asset: ResourceAsset): string {
  if ((asset.url == null) == (asset.content == null)) {
    throw new ResourceError("policy", "a resource needs exactly one of 'url' or 'content'", undefined, asset)
  }
  return asset.url != null
    ? normalized_url(asset.url)
    : asset.content_sha256 != null ? `sha256:${asset.content_sha256}` : `inline:${asset.content!}`
}

function resource_locator(asset: ResourceAsset): string {
  return `${asset.kind}:${locator(asset)}`
}

function resource_identity(asset: ResourceAsset): string {
  return JSON.stringify([
    asset.integrity ?? null, asset.crossorigin ?? null, asset.nonce ?? null, asset.module ?? false,
  ])
}

function resource_description(asset: ResourceAsset): string {
  return asset.url != null ? normalized_url(asset.url) : "inline content"
}

function resolve_assets(requirements: ResourceRequirements, policy: NormalizedPolicy, embed_version: string): ResourceAsset[] {
  const mode = policy.mode == "auto" ? "cdn" : policy.mode
  const expected_version = policy.override_version?.split("+")[0] ?? embed_version
  const expected_semver = Version.from(expected_version)
  const runtime_semver = Version.from(js_version)
  const compatible = expected_semver != null && runtime_semver != null
    ? is_equal(expected_semver, runtime_semver)
    : expected_version == js_version
  if (!compatible) {
    throw new ResourceError(
      "version",
      policy.override_version == null
        ? `Bokeh embed ${embed_version} is incompatible with the loaded BokehJS ${js_version}. Load matching resources`
        : `Bokeh resource policy expects BokehJS ${expected_version}, but the loaded BokehJS is ${js_version}`,
    )
  }
  if (mode == "none") {
    return []
  }
  if (mode == "resolved") {
    return validate_assets(policy.assets ?? [], policy, mode)
  }
  if (mode == "inline" || mode == "offline" || mode == "relative" || mode == "absolute") {
    if (policy.assets == null) {
      throw new ResourceError(
        "policy", `${mode} runtime resource policy requires explicit resolved assets from the embed host`,
      )
    }
    return validate_assets(policy.assets, policy, mode)
  }

  const version = js_version.split("+")[0].replace(/-dev\.(\d+)$/, ".dev$1").replace(/-rc\.(\d+)$/, "rc$1")
  const minified = policy.minified ?? true
  const suffix = minified ? ".min.js" : ".js"
  const assets: ResourceAsset[] = []
  for (const component of requirements.components) {
    // Core is necessarily present when this loader is executing. Validate its
    // shared version above, then load every explicitly requested additive
    // bundle, including the optional API bundle.
    if (component == "bokeh/core") {
      continue
    }
    const filename = `${component_names[component]}-${version}${suffix}`
    const url = mode == "server"
      ? `${(policy.root_url ?? window.location.origin).replace(/\/$/, "")}/static/js/${component_names[component]}${suffix}`
      : `https://cdn.bokeh.org/bokeh/${version.includes("dev") || version.includes("rc") ? "dev" : "release"}/${filename}`
    assets.push({kind: "script", url, nonce: policy.nonce, crossorigin: policy.crossorigin})
  }
  const extension_assets = requirements.extensions.flatMap((extension) => extension.assets)
  if (extension_assets.length != 0 && policy.assets == null) {
    throw new ResourceError(
      "policy",
      "embed extension resources must be resolved by the host. Provide policy assets or load them separately",
    )
  }
  if (policy.assets != null) {
    assets.push(...policy.assets.map((asset) => ({
      ...asset,
      nonce: asset.nonce ?? policy.nonce,
      crossorigin: asset.crossorigin ?? policy.crossorigin ?? (asset.integrity != null ? "anonymous" : undefined),
    })))
  }
  return validate_assets(assets, policy, mode)
}

function validate_assets(assets: ResourceAsset[], policy: NormalizedPolicy, mode: ResourcePolicyMode): ResourceAsset[] {
  for (const asset of assets) {
    locator(asset)
    if (asset.content_sha256 != null && (
      asset.content == null || !/^[0-9a-f]{64}$/.test(asset.content_sha256)
    )) {
      throw new ResourceError(
        "policy", "content_sha256 requires inline content and 64 lowercase hex digits", undefined, asset,
      )
    }
    if ((mode == "inline" || mode == "offline") && asset.url != null) {
      throw new ResourceError("policy", `${mode} resource policy cannot load ${asset.url}`, undefined, asset)
    }
    if (policy.external_only == true && asset.content != null) {
      throw new ResourceError("policy", "external_only resource policy rejects inline content", undefined, asset)
    }
    if (asset.kind == "style" && asset.module == true) {
      throw new ResourceError("policy", "style resources cannot be JavaScript modules", undefined, asset)
    }
    if (policy.integrity == true && asset.url != null && asset.integrity == null) {
      throw new ResourceError(
        "policy", `integrity policy requires a resolved SRI hash for ${asset.url}`, undefined, asset,
      )
    }
  }
  return assets
}

/**
 * Page-shared promise registry for additive embed resources.
 * Concurrent identical declarations share a promise. Conflicting declarations
 * fail, and a failed entry may be retried only when policy opts in.
 */
export class ResourceLoader {
  private readonly _records = new Map<string, {
    identity: string
    state: "loading" | "loaded" | "failed"
    promise: Promise<void>
  }>()

  get size(): number {
    return this._records.size
  }

  /** Forget loader bookkeeping. Intended for isolated hosts and tests. */
  clear(): void {
    this._records.clear()
  }

  /** Wait for resources emitted ahead of an embed bootstrap to finish loading. */
  async wait_for_pending(signal?: AbortSignal): Promise<void> {
    while (true) {
      if (signal?.aborted == true) {
        throw abort_reason(signal)
      }
      const resources = [...document.querySelectorAll<HTMLElement>(
        "[data-bokeh-resource][data-bokeh-resource-state]",
      )]
      const failed = resources.find((resource) => resource.dataset.bokehResourceState == "failed")
      if (failed != null) {
        throw new ResourceError("load", "a generated Bokeh resource failed to load")
      }
      const pending = resources.filter((resource) => resource.dataset.bokehResourceState == "loading")
      if (pending.length == 0) {
        return
      }
      await Promise.all(pending.map((resource) => this._wait_for_pending_resource(resource, signal)))
    }
  }

  /**
   * Resolve and load every required asset before embed deserialization.
   * Explicit policy assets may contain executable code and must be trusted.
   */
  async ensure(requirements: ResourceRequirements, policy: ResourcePolicy = "none",
      embed_version: string = js_version, signal?: AbortSignal): Promise<void> {
    const normalized = normalize_policy(policy)
    const assets = resolve_assets(requirements, normalized, embed_version)
    for (const asset of assets) {
      await wait_with_signal(this._ensure_asset(asset, normalized.retry ?? false), signal)
    }
  }

  private _ensure_asset(asset: ResourceAsset, retry: boolean): Promise<void> {
    const resource_key = resource_locator(asset)
    const identity = resource_identity(asset)
    const existing = this._records.get(resource_key)
    if (existing != null && existing.identity != identity) {
      return Promise.reject(new ResourceError(
        "conflict", `conflicting declarations for Bokeh ${asset.kind} resource ${resource_description(asset)}`,
        undefined, asset,
      ))
    }
    if (existing != null && (!retry || existing.state != "failed")) {
      return existing.promise
    }

    const record = {
      identity,
      state: "loading" as "loading" | "loaded" | "failed",
      promise: Promise.resolve(),
    }
    record.promise = this._load(asset).then(() => {
      record.state = "loaded"
    }, (error) => {
      record.state = "failed"
      throw error instanceof ResourceError
        ? error
        : new ResourceError(
          "load", `failed to load Bokeh ${asset.kind} resource ${resource_description(asset)}: ${error}`,
          error, asset,
        )
    })
    this._records.set(resource_key, record)
    return record.promise
  }

  private _wait_for_pending_resource(resource: HTMLElement, signal?: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let settled = false
      let timer: ReturnType<typeof setTimeout> | null = null
      const stop_tracking = () => {
        resource.removeEventListener("load", loaded)
        resource.removeEventListener("error", failed)
        resource.removeEventListener("bokeh:resource-failed", failed)
        resource.removeEventListener("bokeh:resource-loaded", loaded)
      }
      const cleanup = (keep_tracking = false) => {
        if (!keep_tracking) {
          stop_tracking()
        }
        signal?.removeEventListener("abort", aborted)
        if (timer != null) {
          clearTimeout(timer)
          timer = null
        }
      }
      const settle = (callback: () => void, keep_tracking = false) => {
        if (!settled) {
          settled = true
          cleanup(keep_tracking)
          callback()
        }
      }
      const loaded = () => {
        resource.dataset.bokehResourceState = "loaded"
        stop_tracking()
        settle(resolve)
      }
      const failed = (event?: Event) => {
        resource.dataset.bokehResourceState = "failed"
        stop_tracking()
        settle(() => reject(new ResourceError("load", "a generated Bokeh resource failed to load", event)))
      }
      const timed_out = () => settle(() => {
        resource.dataset.bokehResourceState = "failed"
        reject(new ResourceError("load", "timed out waiting for a generated Bokeh resource"))
      }, true)
      const aborted = () => settle(() => reject(abort_reason(signal!)), true)

      resource.addEventListener("load", loaded, {once: true})
      resource.addEventListener("error", failed, {once: true})
      resource.addEventListener("bokeh:resource-failed", failed, {once: true})
      resource.addEventListener("bokeh:resource-loaded", loaded, {once: true})
      signal?.addEventListener("abort", aborted, {once: true})
      timer = setTimeout(timed_out, generated_resource_timeout)

      if (signal?.aborted == true) {
        queueMicrotask(aborted)
      } else if (resource.dataset.bokehResourceState == "loaded") {
        queueMicrotask(loaded)
      } else if (resource.dataset.bokehResourceState == "failed") {
        queueMicrotask(failed)
      }
    })
  }

  private _load(asset: ResourceAsset): Promise<void> {
    if (asset.content_sha256 != null) {
      const resource_key = resource_locator(asset)
      const existing = document.querySelector<HTMLScriptElement | HTMLStyleElement>(
        `${asset.kind}[data-bokeh-resource="${resource_key}"]`,
      )
      if (existing != null) {
        return this._reuse_existing(existing, asset)
      }
    }

    if (asset.url != null) {
      const url = normalized_url(asset.url)
      const selector = asset.kind == "script" ? "script[src]" : "link[rel=stylesheet][href]"
      const existing = [...document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(selector)].find((element) => {
        const value = element instanceof HTMLScriptElement ? element.src : element.href
        try {
          return normalized_url(value) == url
        } catch {
          return false
        }
      })
      if (existing != null) {
        return this._reuse_existing(existing, asset)
      }
    }

    return new Promise<void>((resolve, reject) => {
      let settled = false
      let timer: ReturnType<typeof setTimeout> | null = null
      let callback: string | null = null
      let source_url: string | null = null
      const callbacks = globalThis as unknown as Record<string, unknown>

      const cleanup = () => {
        if (timer != null) {
          clearTimeout(timer)
        }
        if (callback != null) {
          delete callbacks[callback]
        }
        window.removeEventListener("error", evaluated_error)
      }
      const loaded = () => {
        if (!settled) {
          settled = true
          cleanup()
          element.dataset.bokehResourceState = "loaded"
          element.dispatchEvent(new Event("bokeh:resource-loaded"))
          resolve()
        }
      }
      const failed = (error: ResourceError) => {
        if (!settled) {
          settled = true
          cleanup()
          element.dataset.bokehResourceState = "failed"
          // The caller that owns this load receives the rejection below. Do
          // not also poison unrelated embed declarations already waiting at
          // the page-wide resource barrier.
          element.removeAttribute("data-bokeh-resource")
          element.dispatchEvent(new Event("load"))
          element.remove()
          reject(error)
        }
      }
      const evaluated_error = (event: ErrorEvent) => {
        if (source_url != null && event.filename == source_url) {
          failed(new ResourceError("load", "failed to evaluate inline script", event.error ?? event, asset))
        }
      }
      const element = (() => {
        if (asset.kind == "script") {
          const script = document.createElement("script")
          script.type = asset.module == true ? "module" : "text/javascript"
          if (asset.url != null) {
            script.src = normalized_url(asset.url)
            script.async = false
            script.onload = loaded
            script.onerror = (event) => {
              failed(new ResourceError("load", `failed to load script ${asset.url}`, event, asset))
            }
          } else {
            source_url = unique_id("bokeh_inline_resource")
            window.addEventListener("error", evaluated_error)
            if (asset.module == true) {
              callback = unique_id("__bokeh_resource_module")
              callbacks[callback] = loaded
              script.onerror = (event) => {
                failed(new ResourceError("load", "failed to evaluate inline module", event, asset))
              }
              // Inline module content is an explicitly trusted host resource.
              // The suffix only reports when its asynchronous evaluation ends.
              script.textContent = `//# sourceURL=${source_url}\n${asset.content ?? ""}`
              script.append(document.createTextNode(`\n;globalThis[${JSON.stringify(callback)}]()`))
            } else {
              script.textContent = `//# sourceURL=${source_url}\n${asset.content ?? ""}`
            }
          }
          return script
        } else if (asset.url != null) {
          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = normalized_url(asset.url)
          link.onload = loaded
          link.onerror = (event) => {
            failed(new ResourceError("load", `failed to load stylesheet ${asset.url}`, event, asset))
          }
          return link
        } else {
          const style = document.createElement("style")
          style.textContent = asset.content ?? ""
          return style
        }
      })()

      if (asset.integrity != null) {
        element.setAttribute("integrity", asset.integrity)
      }
      if (asset.crossorigin != null) {
        element.setAttribute("crossorigin", asset.crossorigin)
      }
      if (asset.nonce != null) {
        element.nonce = asset.nonce
      }
      // This attribute is only a DOM marker. Loader identity remains in the
      // page-shared registry without copying inline source into the DOM.
      element.dataset.bokehResource = asset.content_sha256 != null ? resource_locator(asset) : ""
      element.dataset.bokehResourceState = "loading"
      timer = setTimeout(() => {
        failed(new ResourceError("load", `timed out loading Bokeh resource ${resource_description(asset)}`, undefined, asset))
      }, generated_resource_timeout)
      document.head.append(element)
      if (asset.url == null && !(element instanceof HTMLScriptElement && asset.module == true)) {
        loaded()
      }
    })
  }

  private _reuse_existing(element: HTMLScriptElement | HTMLStyleElement | HTMLLinkElement,
      asset: ResourceAsset): Promise<void> {
    const actual = {
      integrity: element.getAttribute("integrity") ?? undefined,
      crossorigin: element.getAttribute("crossorigin") ?? undefined,
      nonce: element.nonce.length != 0 ? element.nonce : undefined,
      module: element instanceof HTMLScriptElement && element.type == "module",
    }
    const expected = {
      integrity: asset.integrity,
      crossorigin: asset.crossorigin,
      nonce: asset.nonce,
      module: asset.module ?? false,
    }
    if (!is_equal(actual, expected)) {
      return Promise.reject(new ResourceError(
        "conflict", `existing DOM resource ${locator(asset)} has a different integrity, CORS, nonce, or module declaration`,
        undefined, asset,
      ))
    }

    const state = element.dataset.bokehResourceState
    if (state == "loaded") {
      return Promise.resolve()
    }
    if (state == "failed") {
      return Promise.reject(new ResourceError("load", `existing DOM resource ${locator(asset)} failed`, undefined, asset))
    }

    return new Promise<void>((resolve, reject) => {
      let settled = false
      let timer: ReturnType<typeof setTimeout> | null = null

      const cleanup = () => {
        element.removeEventListener("load", loaded)
        element.removeEventListener("error", failed)
        element.removeEventListener("bokeh:resource-failed", failed)
        element.removeEventListener("bokeh:resource-loaded", loaded)
        if (timer != null) {
          clearTimeout(timer)
          timer = null
        }
      }
      const settle = (callback: () => void) => {
        if (!settled) {
          settled = true
          cleanup()
          callback()
        }
      }
      const loaded = () => settle(() => {
        element.dataset.bokehResourceState = "loaded"
        resolve()
      })
      const failed = (event: Event) => settle(() => {
        element.dataset.bokehResourceState = "failed"
        reject(new ResourceError("load", `existing DOM resource ${locator(asset)} failed`, event, asset))
      })
      element.addEventListener("load", loaded, {once: true})
      element.addEventListener("error", failed, {once: true})
      element.addEventListener("bokeh:resource-failed", failed, {once: true})
      element.addEventListener("bokeh:resource-loaded", loaded, {once: true})

      timer = setTimeout(() => settle(() => {
        reject(new ResourceError(
          "load", `timed out waiting for existing DOM resource ${locator(asset)}`, undefined, asset,
        ))
      }), existing_resource_timeout)

      const url = asset.url == null ? null : normalized_url(asset.url)
      const already_loaded = element instanceof HTMLLinkElement
        ? element.sheet != null
        : url != null && performance.getEntriesByName(url, "resource").length != 0
      if (already_loaded) {
        queueMicrotask(loaded)
      }
    })
  }
}

/** Shared loader used by every embed mount on the page. */
export const resource_loader = new ResourceLoader()

function track_generated_resource(event: Event): void {
  const resource = event.target
  if (resource instanceof HTMLElement && resource.hasAttribute("data-bokeh-resource") &&
      resource.hasAttribute("data-bokeh-resource-state")) {
    resource.dataset.bokehResourceState = event.type == "load" ? "loaded" : "failed"
  }
}

if (typeof document != "undefined") {
  document.addEventListener("load", track_generated_resource, true)
  document.addEventListener("error", track_generated_resource, true)
}
