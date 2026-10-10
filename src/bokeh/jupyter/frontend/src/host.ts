const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1", "[::1]"])
const proxyChecks = new Map<string, Promise<boolean>>()
const proxyProbeTimeout = 2_000

function withTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`
}

/** Read the Jupyter application base URL without depending on a host module. */
export function jupyterServerBaseUrl(root: Document = document): string | undefined {
  const config = root.getElementById("jupyter-config-data")
  if (config != null) {
    try {
      const data = JSON.parse(config.textContent ?? "") as Record<string, unknown>
      if (typeof data.baseUrl === "string" && data.baseUrl.length !== 0) return data.baseUrl
    } catch {
      // The host owns this record. Let the normal connection diagnostic
      // explain a missing proxy instead of failing widget initialization.
    }
  }
  const encoded = root.body?.dataset.baseUrl
  if (encoded == null || encoded.length === 0) return undefined
  try {
    return decodeURIComponent(encoded)
  } catch {
    return undefined
  }
}

async function proxyAvailable(url: string, request: typeof fetch): Promise<boolean> {
  const check = proxyChecks.get(url) ?? (() => {
    const pending = (async () => {
      const controller = new AbortController()
      const timer = window.setTimeout(() => controller.abort(), proxyProbeTimeout)
      try {
        const response = await request(url, {
          method: "HEAD",
          credentials: "same-origin",
          signal: controller.signal,
        })
        return response.ok
      } catch {
        return false
      } finally {
        window.clearTimeout(timer)
      }
    })()
    proxyChecks.set(url, pending)
    return pending
  })()
  return await check
}

/** Map a kernel-local application URL through a remote Jupyter server. */
export async function resolveJupyterApplicationUrl(applicationUrl: string, serverBaseUrl: string | undefined,
    pageUrl: string = window.location.href, request: typeof fetch = fetch): Promise<string> {
  const urls = (() => {
    try {
      return {application: new URL(applicationUrl), page: new URL(pageUrl)}
    } catch {
      return undefined
    }
  })()
  if (urls == null) return applicationUrl
  const {application, page} = urls
  if (application.origin === page.origin) return applicationUrl
  if (!loopbackHosts.has(application.hostname.toLowerCase()) || application.port.length === 0 ||
      serverBaseUrl == null || serverBaseUrl.length === 0) {
    return applicationUrl
  }
  try {
    const base = new URL(withTrailingSlash(serverBaseUrl), page)
    if (base.origin !== page.origin) return applicationUrl
    const path = application.pathname.replace(/^\/+/, "")
    const proxyUrl = new URL(`proxy/${encodeURIComponent(application.port)}/${path}`, base).toString()
    if (!loopbackHosts.has(page.hostname.toLowerCase())) return proxyUrl
    const probeUrl = new URL("static/js/bokeh.min.js", withTrailingSlash(proxyUrl)).toString()
    return await proxyAvailable(probeUrl, request) ? proxyUrl : applicationUrl
  } catch {
    return applicationUrl
  }
}

/** Rewrite a transient server artifact for the URL visible to this frontend. */
export async function resolveJupyterApplicationArtifact(artifactJson: string, serverBaseUrl: string | undefined,
    pageUrl: string = window.location.href, request: typeof fetch = fetch): Promise<string> {
  const artifact = JSON.parse(artifactJson)
  if (artifact?.source?.kind !== "server" || typeof artifact.source.url !== "string") return artifactJson
  if (artifact.metadata?.notebook_application_proxy === false) return artifactJson
  artifact.source.url = await resolveJupyterApplicationUrl(artifact.source.url, serverBaseUrl, pageUrl, request)
  return JSON.stringify(artifact)
}
