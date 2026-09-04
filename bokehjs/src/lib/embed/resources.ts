import {version as js_version} from "../version"
import {is_equal} from "../core/util/eq"
import {Version} from "../core/util/version"

/** BokehJS bundle capability that an artifact may require. */
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
  integrity?: string
  crossorigin?: string
  nonce?: string
  module?: boolean
}

export type ResourceRequirementAsset = Omit<ResourceAsset, "nonce">

/** Named extension and the assets it contributes. */
export type ExtensionRequirement = {
  name: string
  assets: ResourceRequirementAsset[]
}

/** Exact capabilities and extensions declared by an artifact. */
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
  minified?: boolean
  root_url?: string
  nonce?: string
  crossorigin?: string
  integrity?: boolean
  external_only?: boolean
  retry?: boolean
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

function normalize_policy(policy: ResourcePolicy = "auto"): NormalizedPolicy {
  const normalized = typeof policy == "string" ? {mode: policy} : policy
  if (!resource_policy_modes.has(normalized.mode)) {
    throw new ResourceError("policy", `unknown Bokeh resource policy '${normalized.mode}'`)
  }
  return normalized
}

function normalized_url(url: string): string {
  return new URL(url, document.baseURI).href
}

function locator(asset: ResourceAsset): string {
  if ((asset.url == null) == (asset.content == null)) {
    throw new ResourceError("policy", "a resource needs exactly one of 'url' or 'content'", undefined, asset)
  }
  return asset.url != null ? normalized_url(asset.url) : `inline:${asset.content!}`
}

function resource_identity(asset: ResourceAsset): string {
  return JSON.stringify([
    asset.kind, locator(asset), asset.integrity ?? null, asset.crossorigin ?? null,
    asset.nonce ?? null, asset.module ?? false,
  ])
}

function resolve_assets(requirements: ResourceRequirements, policy: NormalizedPolicy, artifact_version: string): ResourceAsset[] {
  const mode = policy.mode == "auto" ? "cdn" : policy.mode
  const artifact_semver = Version.from(artifact_version)
  const runtime_semver = Version.from(js_version)
  const compatible = artifact_semver != null && runtime_semver != null
    ? is_equal(artifact_semver, runtime_semver)
    : artifact_version == js_version
  if (!compatible) {
    throw new ResourceError(
      "version",
      `Bokeh artifact ${artifact_version} is incompatible with the loaded BokehJS ${js_version}; load matching resources`,
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
        "policy", `${mode} runtime resource policy requires explicit resolved assets from the artifact host`,
      )
    }
    return validate_assets(policy.assets, policy, mode)
  }

  const version = artifact_version.split("+")[0]
  const minified = policy.minified ?? true
  const suffix = minified ? ".min.js" : ".js"
  const assets: ResourceAsset[] = []
  for (const component of requirements.components) {
    // Core and the API mount bundle are necessarily present when this loader
    // is executing. Validate their shared version above, then load only
    // additive feature bundles.
    if (component == "bokeh/core" || component == "bokeh/api") {
      continue
    }
    const filename = `${component_names[component]}-${version}${suffix}`
    const url = mode == "server"
      ? `${(policy.root_url ?? window.location.origin).replace(/\/$/, "")}/static/js/${component_names[component]}${suffix}`
      : `https://cdn.bokeh.org/bokeh/${version.includes("dev") || version.includes("rc") ? "dev" : "release"}/${filename}`
    assets.push({kind: "script", url, nonce: policy.nonce, crossorigin: policy.crossorigin})
  }
  for (const extension of requirements.extensions) {
    assets.push(...extension.assets.map((asset) => ({
      ...asset,
      nonce: policy.nonce,
      crossorigin: asset.crossorigin ?? policy.crossorigin ?? (asset.integrity != null ? "anonymous" : undefined),
    })))
  }
  return validate_assets(assets, policy, mode)
}

function validate_assets(assets: ResourceAsset[], policy: NormalizedPolicy, mode: ResourcePolicyMode): ResourceAsset[] {
  for (const asset of assets) {
    locator(asset)
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
 * Page-shared promise registry for additive artifact resources.
 * Concurrent identical declarations share a promise; conflicting declarations
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

  /** Forget loader bookkeeping; intended for isolated hosts and tests. */
  clear(): void {
    this._records.clear()
  }

  /** Resolve and load every required asset before artifact deserialization. */
  async ensure(requirements: ResourceRequirements, policy: ResourcePolicy = "auto",
      artifact_version: string = js_version): Promise<void> {
    const normalized = normalize_policy(policy)
    const assets = resolve_assets(requirements, normalized, artifact_version)
    for (const asset of assets) {
      await this._ensure_asset(asset, normalized.retry ?? false)
    }
  }

  private _ensure_asset(asset: ResourceAsset, retry: boolean): Promise<void> {
    const resource_locator = `${asset.kind}:${locator(asset)}`
    const identity = resource_identity(asset)
    const existing = this._records.get(resource_locator)
    if (existing != null && existing.identity != identity) {
      return Promise.reject(new ResourceError(
        "conflict", `conflicting declarations for Bokeh resource ${resource_locator}`, undefined, asset,
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
        : new ResourceError("load", `failed to load Bokeh resource ${resource_locator}: ${error}`, error, asset)
    })
    this._records.set(resource_locator, record)
    return record.promise
  }

  private _load(asset: ResourceAsset): Promise<void> {
    if (asset.url != null) {
      const url = normalized_url(asset.url)
      const selector = asset.kind == "script" ? "script[src]" : "link[rel=stylesheet][href]"
      const existing = [...document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(selector)].find((element) => {
        const value = element instanceof HTMLScriptElement ? element.src : element.href
        return normalized_url(value) == url
      })
      if (existing != null) {
        return this._reuse_existing(existing, asset)
      }
    }

    return new Promise<void>((resolve, reject) => {
      const element = (() => {
        if (asset.kind == "script") {
          const script = document.createElement("script")
          script.type = asset.module == true ? "module" : "text/javascript"
          if (asset.url != null) {
            script.src = asset.url
            script.async = false
            script.onload = () => {
              script.dataset.bokehResourceState = "loaded"
              resolve()
            }
            script.onerror = (event) => {
              script.dataset.bokehResourceState = "failed"
              script.remove()
              reject(new ResourceError("load", `failed to load script ${asset.url}`, event, asset))
            }
          } else {
            if (asset.module == true) {
              const callback = `__bokeh_resource_module_${crypto.randomUUID().replaceAll("-", "")}`
              const callbacks = globalThis as unknown as Record<string, unknown>
              callbacks[callback] = () => {
                delete callbacks[callback]
                script.dataset.bokehResourceState = "loaded"
                resolve()
              }
              script.onerror = (event) => {
                delete callbacks[callback]
                script.dataset.bokehResourceState = "failed"
                script.remove()
                reject(new ResourceError("load", "failed to evaluate inline module", event, asset))
              }
              script.textContent = `${asset.content ?? ""}\n;globalThis[${JSON.stringify(callback)}]()`
            } else {
              script.textContent = asset.content ?? ""
            }
          }
          return script
        } else if (asset.url != null) {
          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = asset.url
          link.onload = () => {
            link.dataset.bokehResourceState = "loaded"
            resolve()
          }
          link.onerror = (event) => {
            link.dataset.bokehResourceState = "failed"
            link.remove()
            reject(new ResourceError("load", `failed to load stylesheet ${asset.url}`, event, asset))
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
      element.dataset.bokehResource = resource_identity(asset)
      element.dataset.bokehResourceState = "loading"
      document.head.append(element)
      if (asset.url == null && !(element instanceof HTMLScriptElement && asset.module == true)) {
        element.dataset.bokehResourceState = "loaded"
        resolve()
      }
    })
  }

  private _reuse_existing(element: HTMLScriptElement | HTMLLinkElement, asset: ResourceAsset): Promise<void> {
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
      const loaded = () => {
        element.dataset.bokehResourceState = "loaded"
        resolve()
      }
      const failed = (event: Event) => {
        element.dataset.bokehResourceState = "failed"
        reject(new ResourceError("load", `existing DOM resource ${locator(asset)} failed`, event, asset))
      }
      element.addEventListener("load", loaded, {once: true})
      element.addEventListener("error", failed, {once: true})

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

/** Shared loader used by every artifact mount on the page. */
export const resource_loader = new ResourceLoader()
