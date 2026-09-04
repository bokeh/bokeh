import {version as js_version} from "../version"
import {is_equal} from "../core/util/eq"
import {Version} from "../core/util/version"

export type ResourceComponent =
  | "bokeh/core"
  | "bokeh/widgets"
  | "bokeh/tables"
  | "bokeh/webgl"
  | "bokeh/mathjax"
  | "bokeh/api"

export type ResourceAsset = {
  kind: "script" | "style"
  url?: string
  content?: string
  integrity?: string
  crossorigin?: string
  nonce?: string
  module?: boolean
}

export type ExtensionRequirement = {
  name: string
  assets: ResourceAsset[]
}

export type ResourceRequirements = {
  components: ResourceComponent[]
  extensions: ExtensionRequirement[]
}

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

export type ResourcePolicy = ResourcePolicyMode | {
  mode: ResourcePolicyMode
  version?: string
  minified?: boolean
  root_url?: string
  nonce?: string
  crossorigin?: string
  integrity?: boolean
  external_only?: boolean
  retry?: boolean
  assets?: ResourceAsset[]
}

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

function hash_content(content: string): string {
  let hash = 2166136261
  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16)
}

function normalized_url(url: string): string {
  return new URL(url, document.baseURI).href
}

function locator(asset: ResourceAsset): string {
  if ((asset.url == null) == (asset.content == null)) {
    throw new ResourceError("policy", "a resource needs exactly one of 'url' or 'content'", undefined, asset)
  }
  return asset.url != null ? normalized_url(asset.url) : `inline:${hash_content(asset.content!)}`
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

  const version = (policy.version ?? artifact_version).split("+")[0]
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
      nonce: asset.nonce ?? policy.nonce,
      crossorigin: asset.crossorigin ?? policy.crossorigin,
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
    if (policy.integrity == true && asset.url != null && asset.integrity == null) {
      throw new ResourceError(
        "policy", `integrity policy requires a resolved SRI hash for ${asset.url}`, undefined, asset,
      )
    }
  }
  return assets
}

export class ResourceLoader {
  private readonly _registry = new Map<string, Promise<void>>()
  private readonly _declarations = new Map<string, string>()
  private readonly _states = new Map<string, "loading" | "loaded" | "failed">()

  get size(): number {
    return this._registry.size
  }

  clear(): void {
    this._registry.clear()
    this._declarations.clear()
    this._states.clear()
  }

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
    const existing_identity = this._declarations.get(resource_locator)
    if (existing_identity != null && existing_identity != identity) {
      return Promise.reject(new ResourceError(
        "conflict", `conflicting declarations for Bokeh resource ${resource_locator}`, undefined, asset,
      ))
    }
    this._declarations.set(resource_locator, identity)

    const existing = this._registry.get(identity)
    if (existing != null && (!retry || this._states.get(identity) != "failed")) {
      return existing
    }

    this._states.set(identity, "loading")
    const loading = this._load(asset).then(() => {
      this._states.set(identity, "loaded")
    }, (error) => {
      this._states.set(identity, "failed")
      throw error instanceof ResourceError
        ? error
        : new ResourceError("load", `failed to load Bokeh resource ${resource_locator}: ${error}`, error, asset)
    })
    this._registry.set(identity, loading)
    return loading
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
        return Promise.resolve()
      }
    }

    return new Promise<void>((resolve, reject) => {
      let element: HTMLScriptElement | HTMLLinkElement | HTMLStyleElement
      if (asset.kind == "script") {
        const script = document.createElement("script")
        script.type = asset.module == true ? "module" : "text/javascript"
        if (asset.url != null) {
          script.src = asset.url
          script.async = false
          script.onload = () => resolve()
          script.onerror = (event) => {
            script.remove()
            reject(new ResourceError("load", `failed to load script ${asset.url}`, event, asset))
          }
        } else {
          script.text = asset.content ?? ""
        }
        element = script
      } else if (asset.url != null) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = asset.url
        link.onload = () => resolve()
        link.onerror = (event) => {
          link.remove()
          reject(new ResourceError("load", `failed to load stylesheet ${asset.url}`, event, asset))
        }
        element = link
      } else {
        const style = document.createElement("style")
        style.textContent = asset.content ?? ""
        element = style
      }

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
      document.head.append(element)
      if (asset.url == null) {
        resolve()
      }
    })
  }
}

export const resource_loader = new ResourceLoader()
