import {renderHTML} from "@jupyterlab/rendermime"
import {IRenderMime} from "@jupyterlab/rendermime-interfaces"
import {Widget} from "@lumino/widgets"

import {ContextManager} from "./context"
import {kernelProxy} from "./kernel"
import {
  assertProtocol,
  BokehNotebookError,
  DISPLAY_MIME_TYPE,
  DisplayPayload,
  FILE_MIME_TYPE,
  FilePayload,
  RESOURCES_MIME_TYPE,
  ResourcePayload,
} from "./protocol"
import {
  FrontendDocumentSnapshot,
  bokehVersionConflict,
  currentDocumentSnapshot,
  loadResources,
  renderDiagnostic,
  renderDisplay,
  renderLoading,
} from "./runtime"

export class ResourceRenderer extends Widget implements IRenderMime.IRenderer {
  constructor(_options: IRenderMime.IRendererOptions, private manager: ContextManager) {super()}

  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    const payload = model.data[RESOURCES_MIME_TYPE] as unknown as ResourcePayload
    const javascript = (model.data["application/javascript"] as string | undefined) ?? ""
    const stopLoading = renderLoading(this.node, "Loading shared BokehJS resources…")
    try {
      await loadResources(payload, javascript, this.node, kernelProxy(this.manager))
      stopLoading()
    } catch (error) {
      stopLoading()
      renderDiagnostic(this.node, error, {payload})
    }
  }
}

export class FileRenderer extends Widget implements IRenderMime.IRenderer {
  constructor(private manager: ContextManager) {super()}

  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    const payload = model.data[FILE_MIME_TYPE] as unknown as FilePayload
    try {
      assertProtocol(payload)
      const anchor = document.createElement("a")
      anchor.href = await this.manager.fileUrl(payload.path)
      anchor.target = "_blank"
      anchor.rel = "noopener noreferrer"
      anchor.textContent = `Open ${payload.path}`
      this.node.replaceChildren(anchor)
    } catch (error) {
      const diagnostic = error instanceof BokehNotebookError ? error : new BokehNotebookError(
        "FILE_LINK_FAILED",
        "Jupyter could not create a browser URL for the saved Bokeh file.",
        "Save the file under the notebook directory, then evaluate save(...) again.",
        error,
      )
      renderDiagnostic(this.node, diagnostic, {payload})
    }
  }
}

export class DisplayRenderer extends Widget implements IRenderMime.IRenderer {
  private cleanup?: () => void
  private controller?: AbortController
  private generation = 0
  private payload?: DisplayPayload

  constructor(private options: IRenderMime.IRendererOptions, private manager: ContextManager) {
    super()
    manager.add(this)
  }

  snapshot(): FrontendDocumentSnapshot | undefined {
    return this.payload == null ? undefined : currentDocumentSnapshot(this.node, this.payload)
  }

  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    const generation = ++this.generation
    this.controller?.abort()
    this.controller = new AbortController()
    this.cleanup?.()
    this.cleanup = undefined
    const payload = model.data[DISPLAY_MIME_TYPE] as unknown as DisplayPayload
    this.payload = payload
    const html = (model.data["text/html"] as string | undefined) ?? ""
    renderLoading(this.node, payload.source_kind === "server" ? "Connecting to Bokeh ASGI application…" : "Rendering Bokeh artifact…")
    try {
      const cleanup = await renderDisplay(this.node, payload, html, kernelProxy(this.manager), this.controller.signal)
      if (generation === this.generation && !this.isDisposed) this.cleanup = cleanup
      else cleanup()
    } catch (error) {
      if (generation === this.generation && !this.isDisposed && !(error instanceof DOMException && error.name === "AbortError")) {
        if (error instanceof BokehNotebookError && error.code === "PROTOCOL_VERSION_MISMATCH" && html.length !== 0) {
          const activeVersion = window.Bokeh?.version
          if (activeVersion != null && activeVersion !== payload.bokeh_version) {
            renderDiagnostic(this.node, bokehVersionConflict(
              `This saved output expects BokehJS ${payload.bokeh_version}, but BokehJS ${activeVersion} is already active in the page.`,
              error,
            ), {payload})
            return
          }
          await renderHTML({
            host: this.node,
            source: html,
            trusted: model.trusted,
            sanitizer: this.options.sanitizer,
            resolver: this.options.resolver,
            linkHandler: this.options.linkHandler,
            shouldTypeset: false,
            latexTypesetter: this.options.latexTypesetter,
            translator: this.options.translator,
          })
          if (generation !== this.generation || this.isDisposed) return
          const notice = document.createElement("div")
          notice.className = "bk-notebook-protocol-fallback"
          notice.setAttribute("role", "note")
          notice.style.cssText = "border:1px solid #d6b656;border-left-width:5px;padding:10px 12px;margin:4px 0;background:#fff8e1;color:#222;font:13px/1.4 system-ui,sans-serif"
          const title = document.createElement("strong")
          title.textContent = "Limited Bokeh notebook output"
          const message = document.createElement("p")
          message.style.margin = "4px 0 0"
          message.textContent = `${error.message} The portable HTML view is shown instead, without Python-connected updates or other frontend integration.`
          notice.append(title, message)
          this.node.prepend(notice)
        } else {
          renderDiagnostic(this.node, error, {payload})
        }
      }
    }
  }

  dispose(): void {
    if (this.isDisposed) return
    this.generation++
    this.controller?.abort()
    this.controller = undefined
    this.cleanup?.()
    this.cleanup = undefined
    this.payload = undefined
    this.manager.remove(this)
    super.dispose()
  }
}
