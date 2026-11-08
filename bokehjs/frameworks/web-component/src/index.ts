import type {BokehMount, MountOptions} from "@bokeh/bokehjs"
import {DocumentMountController, MountController, SessionMountController} from "@bokeh/framework"
import type {BokehModel, BokehRootModel, BokehRootReference, BokehSessionSource} from "@bokeh/framework"

const HTMLElementBase = (globalThis as {HTMLElement?: typeof HTMLElement}).HTMLElement ?? class {} as typeof HTMLElement

function define_element<T extends CustomElementConstructor>(name: string, base: T, define: () => T): T {
  const existing = customElements.get(name)
  if (existing != null) {
    if (existing != base && !(existing.prototype instanceof base)) {
      throw new Error(`custom element '${name}' is already defined by another constructor`)
    }
    return existing as T
  }
  const element = define()
  customElements.define(name, element)
  return element
}

/** Custom-element base that owns one Bokeh mount while connected. */
export class BokehElement extends HTMLElementBase {
  private _model: BokehModel | null = null
  private _mount_options: MountOptions | undefined
  private _controller = new MountController()

  /** The Bokeh root, roots array, or document to render in one mount. */
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

/** Register an idempotent custom element for one Bokeh source. */
export function defineBokehElement(name: string = "bokeh-plot"): typeof BokehElement {
  return define_element(name, BokehElement, () => class extends BokehElement {})
}

/** Custom-element provider for one shared keyed document mount. */
export class BokehDocumentElement extends HTMLElementBase {
  private _models: readonly BokehRootModel[] = []
  private _mount_options: MountOptions | undefined
  private readonly _controller = new DocumentMountController()

  get models(): readonly BokehRootModel[] {
    return this._models
  }

  set models(models: readonly BokehRootModel[]) {
    this._models = models
    if (this.isConnected) {
      this._update()
    }
  }

  get mountOptions(): MountOptions | undefined {
    return this._mount_options
  }

  set mountOptions(options: MountOptions | undefined) {
    this._mount_options = options
    if (this.isConnected) {
      this._update()
    }
  }

  connectedCallback(): void {
    this._update()
  }

  disconnectedCallback(): void {
    this._controller.dispose()
  }

  attach(model: BokehRootReference, target: HTMLElement): () => void {
    return this._controller.attach(model, target)
  }

  private _update(): void {
    this._controller.update(this._models, {
      mountOptions: this._mount_options,
      onMounted: (mounted) => this.dispatchEvent(new CustomEvent<BokehMount>("bokeh-mount", {detail: mounted})),
      onDisposed: (mounted) => this.dispatchEvent(new CustomEvent<BokehMount>("bokeh-unmount", {detail: mounted})),
      onError: (error) => this.dispatchEvent(new CustomEvent("bokeh-mount-error", {detail: error})),
    })
  }
}

/** Custom-element provider for a borrowed or acquired live session. */
export class BokehSessionElement extends HTMLElementBase {
  private _source: BokehSessionSource | null = null
  private _mount_options: MountOptions | undefined
  private readonly _controller = new SessionMountController()

  /** Borrow a session, acquire a connection, or suspend the provider with null. */
  get source(): BokehSessionSource | null {
    return this._source
  }

  set source(source: BokehSessionSource | null) {
    this._source = source
    if (this.isConnected) {
      this._update()
    }
  }

  get mountOptions(): MountOptions | undefined {
    return this._mount_options
  }

  set mountOptions(options: MountOptions | undefined) {
    this._mount_options = options
    if (this.isConnected) {
      this._update()
    }
  }

  connectedCallback(): void {
    this._update()
  }

  disconnectedCallback(): void {
    this._controller.dispose()
  }

  attach(model: BokehRootReference, target: HTMLElement): () => void {
    return this._controller.attach(model, target)
  }

  private _update(): void {
    this._controller.update(this._source, {
      mountOptions: this._mount_options,
      onSession: (session) => this.dispatchEvent(new CustomEvent("bokeh-session", {detail: session})),
      onMounted: (mounted) => this.dispatchEvent(new CustomEvent<BokehMount>("bokeh-mount", {detail: mounted})),
      onDisposed: (mounted) => this.dispatchEvent(new CustomEvent<BokehMount>("bokeh-unmount", {detail: mounted})),
      onError: (error) => this.dispatchEvent(new CustomEvent("bokeh-mount-error", {detail: error})),
    })
  }
}

type BokehProviderElement = BokehDocumentElement | BokehSessionElement

/** Target slot for one root supplied by a document or session provider. */
export class BokehRootElement extends HTMLElementBase {
  private _model: BokehRootReference | null = null
  private _bokeh_document: BokehProviderElement | null = null
  private _detach: (() => void) | null = null

  /** A root model, or a unique model name when using a session provider. */
  get model(): BokehRootReference | null {
    return this._model
  }

  set model(model: BokehRootReference | null) {
    this._model = model
    if (this.isConnected) {
      this._connect()
    }
  }

  /** Explicit provider for roots that aren't descendants of their provider element. */
  get bokehDocument(): BokehProviderElement | null {
    return this._bokeh_document
  }

  set bokehDocument(element: BokehProviderElement | null) {
    this._bokeh_document = element
    if (this.isConnected) {
      this._connect()
    }
  }

  connectedCallback(): void {
    this._connect()
  }

  disconnectedCallback(): void {
    this._detach?.()
    this._detach = null
  }

  private _find_document(): BokehProviderElement | null {
    let current: Node | null = this.parentNode
    while (current != null) {
      if (current instanceof BokehDocumentElement || current instanceof BokehSessionElement) {
        return current
      }
      current = current.parentNode ?? ((current as {host?: Node}).host ?? null)
    }
    return null
  }

  private _connect(): void {
    this._detach?.()
    this._detach = null
    if (this._model == null) {
      return
    }

    const provider = this._bokeh_document ?? this._find_document()
    if (provider == null) {
      this.dispatchEvent(new CustomEvent("bokeh-mount-error", {
        detail: new Error("BokehRootElement requires a BokehDocumentElement or BokehSessionElement provider"),
      }))
      return
    }
    try {
      this._detach = provider.attach(this._model, this)
    } catch (error) {
      this.dispatchEvent(new CustomEvent("bokeh-mount-error", {detail: error}))
    }
  }
}

/** Register an idempotent shared-document provider element. */
export function defineBokehDocumentElement(name: string = "bokeh-document"): typeof BokehDocumentElement {
  return define_element(name, BokehDocumentElement, () => class extends BokehDocumentElement {})
}

/** Register an idempotent live-session provider element. */
export function defineBokehSessionElement(name: string = "bokeh-session"): typeof BokehSessionElement {
  return define_element(name, BokehSessionElement, () => class extends BokehSessionElement {})
}

/** Register an idempotent keyed-root target element. */
export function defineBokehRootElement(name: string = "bokeh-root"): typeof BokehRootElement {
  return define_element(name, BokehRootElement, () => class extends BokehRootElement {})
}
