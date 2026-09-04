import {DocumentRegistry} from "@jupyterlab/docregistry"
import {INotebookModel} from "@jupyterlab/notebook"
import {Contents} from "@jupyterlab/services"
import {IDisposable} from "@lumino/disposable"

import {BokehNotebookError} from "./protocol"
import {FrontendDocumentSnapshot} from "./runtime"

export interface SnapshotSource {
  snapshot(): FrontendDocumentSnapshot | undefined
}

export class ContextManager implements IDisposable {
  constructor(
    private _context: DocumentRegistry.IContext<INotebookModel> | null,
    private readonly contents: Contents.IManager,
  ) {}
  private readonly renderers = new Set<SnapshotSource>()
  private ownedViews = new Set<string>()
  get context(): DocumentRegistry.IContext<INotebookModel> {
    if (this._context == null) throw new Error("Notebook context was disposed")
    return this._context
  }
  get isDisposed(): boolean {return this._context == null}
  get path(): string {return this.context.path}
  async fileUrl(path: string): Promise<string> {
    if (path.startsWith("/") || /^[A-Za-z]:\//.test(path) || path.includes("\\") || path.split("/").includes("..")) {
      throw new BokehNotebookError(
        "FILE_PATH_UNAVAILABLE",
        "The saved file is not relative to this notebook.",
        "Save the file under the notebook directory, then evaluate save(...) again.",
      )
    }
    const parts = this.path.split("/")
    parts.pop()
    for (const part of path.split("/")) {
      if (part === "" || part === ".") continue
      parts.push(part)
    }
    return this.contents.getDownloadUrl(parts.join("/"))
  }
  add(renderer: SnapshotSource): void {this.renderers.add(renderer)}
  remove(renderer: SnapshotSource): void {this.renderers.delete(renderer)}
  setOwnedViews(viewIds: ReadonlySet<string>): void {this.ownedViews = new Set(viewIds)}
  snapshots(): FrontendDocumentSnapshot[] {
    const byView = new Map<string, FrontendDocumentSnapshot>()
    for (const renderer of this.renderers) {
      const snapshot = renderer.snapshot()
      if (snapshot != null) byView.set(snapshot.view_id, snapshot)
    }
    const hosted: FrontendDocumentSnapshot[] = []
    window.dispatchEvent(new CustomEvent("bokeh:notebook-export-snapshots", {detail: {snapshots: hosted}}))
    for (const snapshot of hosted) {
      if (this.ownedViews.has(snapshot.view_id)) byView.set(snapshot.view_id, snapshot)
    }
    return [...byView.values()]
  }
  dispose(): void {
    this.renderers.clear()
    this.ownedViews.clear()
    this._context = null
  }
}
