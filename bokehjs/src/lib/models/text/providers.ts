import type {MathJaxAPI} from "../../external/mathjax"

import {Signal0} from "core/signaling"
import {load_module} from "core/util/modules"
import {registered_mathjax} from "./mathjax_registry"

type MathJaxStatus = "not_started" | "loaded" | "loading" | "failed"

export abstract class MathJaxProvider {
  /** Emitted when loading MathJax finished, whether it succeeded or failed. */
  readonly ready = new Signal0(this, "ready")

  protected _status: MathJaxStatus = "not_started"

  get status(): MathJaxStatus {
    return this._status
  }

  set status(status: MathJaxStatus) {
    this._status = status
  }

  /** Whether MathJax wasn't loaded yet, but may still be. */
  get is_pending(): boolean {
    return this.status == "not_started" || this.status == "loading"
  }

  abstract get MathJax(): MathJaxAPI | null

  abstract fetch(): Promise<void>

  private _loading: Promise<void> | null = null

  /**
   * Starts loading MathJax, unless it's available or loading it was already
   * attempted. Resolves once it's loaded or failed to load. Unlike `fetch()`,
   * this can be called any number of times, e.g. once per view.
   */
  load(): Promise<void> {
    if (!this.is_pending) {
      return Promise.resolve()
    }
    return this._loading ??= this.fetch()
  }
}

export class NoProvider extends MathJaxProvider {
  get MathJax(): null {
    return null
  }

  async fetch(): Promise<void> {
    this.status = "failed"
  }
}

export class CDNProvider extends MathJaxProvider  {
  get MathJax(): MathJaxAPI | null {
    return typeof MathJax !== "undefined" ? MathJax : null
  }

  async fetch(): Promise<void> {
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
    const loaded = new Promise<void>((resolve) => {
      script.onload = () => {
        this.status = "loaded"
        resolve()
      }
      script.onerror = () => {
        this.status = "failed"
        resolve()
      }
    })
    this.status = "loading"
    document.head.appendChild(script)
    await loaded
    this.ready.emit()
  }
}

export class BundleProvider extends MathJaxProvider  {
  override get status(): MathJaxStatus {
    // the MathJax module may have been registered by other means, e.g. a script tag
    return this.MathJax != null ? "loaded" : this._status
  }

  override set status(status: MathJaxStatus) {
    this._status = status
  }

  get MathJax(): MathJaxAPI | null {
    return registered_mathjax()
  }

  async fetch(): Promise<void> {
    if (this.MathJax != null) {
      return
    }

    this.status = "loading"
    try {
      // registers itself when evaluated
      await load_module(import("./mathjax"))
      this.status = registered_mathjax() != null ? "loaded" : "failed"
    } catch {
      this.status = "failed"
    }
    this.ready.emit()
  }
}

export const default_provider: MathJaxProvider = new BundleProvider()
