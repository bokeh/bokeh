import type {BokehMount, MountOptions} from "@bokeh/bokehjs"
import {MountController} from "@bokeh/framework"
import type {BokehModel} from "@bokeh/framework"

const HTMLElementBase = (globalThis as {HTMLElement?: typeof HTMLElement}).HTMLElement ?? class {} as typeof HTMLElement

export class BokehElement extends HTMLElementBase {
  private _model: BokehModel | null = null
  private _mount_options: MountOptions | undefined
  private _controller = new MountController()

  get model(): BokehModel | null {
    return this._model
  }

  set model(model: BokehModel | null) {
    if (model == this._model) {
      return
    }
    this._model = model
    if (this.isConnected) {
      this._restart()
    }
  }

  get mountOptions(): MountOptions | undefined {
    return this._mount_options
  }

  set mountOptions(options: MountOptions | undefined) {
    this._mount_options = options
    if (this.isConnected && this._model != null) {
      this._restart()
    }
  }

  connectedCallback(): void {
    this._restart()
  }

  disconnectedCallback(): void {
    this._controller.dispose()
  }

  private _restart(): void {
    this._controller.dispose()
    if (this._model == null) {
      return
    }

    this._controller = new MountController()
    void this._controller.start(this._model, this, {
      mountOptions: this._mount_options,
      onMounted: (mounted) => this.dispatchEvent(new CustomEvent<BokehMount>("bokeh-mount", {detail: mounted})),
      onDisposed: (mounted) => this.dispatchEvent(new CustomEvent<BokehMount>("bokeh-unmount", {detail: mounted})),
      onError: (error) => this.dispatchEvent(new CustomEvent("bokeh-mount-error", {detail: error})),
    })
  }
}

export function defineBokehElement(name: string = "bokeh-plot"): typeof BokehElement {
  const existing = customElements.get(name)
  if (existing != null) {
    if (existing != BokehElement && !(existing.prototype instanceof BokehElement)) {
      throw new Error(`custom element '${name}' is already defined by another constructor`)
    }
    return existing as typeof BokehElement
  }
  const DefinedBokehElement = class extends BokehElement {}
  customElements.define(name, DefinedBokehElement)
  return DefinedBokehElement
}
