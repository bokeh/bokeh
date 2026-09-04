import {JupyterFrontEnd} from "@jupyterlab/application"
import {NbConvert, ServerConnection} from "@jupyterlab/services"

import {NotebookExtension} from "./notebook"
import {FrontendDocumentSnapshot} from "./runtime"

function correlationId(): string {
  if (globalThis.crypto?.randomUUID != null) return globalThis.crypto.randomUUID()
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("")
}

function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/")
}

export function exportUrl(serverSettings: ServerConnection.ISettings, options: NbConvert.IExportOptions,
    exportId: string): string {
  const base = serverSettings.baseUrl.endsWith("/") ? serverSettings.baseUrl : `${serverSettings.baseUrl}/`
  const url = new URL(`${base}bokeh-notebook/export/${encodeURIComponent(options.format)}/${encodePath(options.path)}`, window.location.href)
  url.searchParams.set("export_id", exportId)
  if (options.exporterOptions?.download === true) url.searchParams.set("download", "true")
  return url.toString()
}

export async function publishExportSnapshots(serverSettings: ServerConnection.ISettings, path: string,
    exportId: string, snapshots: FrontendDocumentSnapshot[]): Promise<void> {
  const base = serverSettings.baseUrl.endsWith("/") ? serverSettings.baseUrl : `${serverSettings.baseUrl}/`
  const response = await ServerConnection.makeRequest(`${base}bokeh-notebook/export-snapshots`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({path, export_id: exportId, snapshots}),
  }, serverSettings)
  if (!response.ok) throw await ServerConnection.ResponseError.create(response)
}

export function installExportInterceptor(app: JupyterFrontEnd, notebooks: NotebookExtension): void {
  const manager = app.serviceManager.nbconvert
  const original = manager.exportAs?.bind(manager)
  if (original == null) return
  manager.exportAs = async (options: NbConvert.IExportOptions) => {
    if (options.format !== "html" && options.format !== "bokeh") return original(options)
    const popup = window.open("about:blank", "_blank")
    if (popup != null) popup.opener = null
    const snapshots = notebooks.snapshots(options.path)
    const exportId = correlationId()
    try {
      await publishExportSnapshots(manager.serverSettings, options.path, exportId, snapshots)
    } catch (error) {
      console.warn(
        "Bokeh could not send current frontend state to the notebook exporter; the export will use saved notebook artifacts.",
        error,
      )
      const failures = snapshots.map(({view_id}) => ({
        view_id,
        error: "The notebook frontend could not transfer its current state to the Jupyter server.",
      }))
      try {await publishExportSnapshots(manager.serverSettings, options.path, exportId, failures)}
      catch {
        // The Bokeh server extension itself is unavailable. Fall back to the
        // standard exporter so the user still receives a saved-state export.
        popup?.close()
        return original(options)
      }
    }
    const url = exportUrl(manager.serverSettings, options, exportId)
    if (popup != null) popup.location.replace(url)
    else {
      const link = document.createElement("a")
      link.href = url
      link.target = "_self"
      link.click()
    }
  }
}
