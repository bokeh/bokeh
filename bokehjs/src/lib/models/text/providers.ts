import type {MathJaxAPI} from "../../external/mathjax"

import {Signal0} from "core/signaling"
import {load_module} from "core/util/modules"

type MathJaxStatus = "not_started" | "loaded" | "loading" | "failed"

export abstract class MathJaxProvider {
  readonly ready = new Signal0(this, "ready")

  status: MathJaxStatus = "not_started"

  abstract get MathJax(): MathJaxAPI | null

  abstract fetch(): Promise<void>
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
    script.onload = () => {
      this.status = "loaded"
      this.ready.emit()
    }
    script.onerror = () => {
      this.status = "failed"
    }
    this.status = "loading"
    document.head.appendChild(script)
  }
}

export class BundleProvider extends MathJaxProvider  {
  _mathjax: MathJaxAPI | null

  get MathJax(): MathJaxAPI | null {
    return this._mathjax
  }

  async fetch(): Promise<void> {
    this.status = "loading"

    try {
      const mathjax = await load_module(import("./mathjax"))
      this.status = mathjax == null ? "failed" : "loaded"
      this._mathjax = mathjax
      this.ready.emit()
    } catch (error) {
      this.status = "failed"
    }
  }
}

export const default_provider: MathJaxProvider = new BundleProvider()
