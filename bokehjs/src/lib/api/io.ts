import {Document} from "../document"
import {mount_document_standalone} from "../embed/standalone"
import type {StandaloneMount} from "../embed/standalone"
import type {EmbedTarget} from "../embed/dom"

import type {ViewOf} from "core/view"
import type {ViewManager} from "core/view_manager"
import type {HasProps} from "core/has_props"
import {dom_ready, contains} from "core/dom"
import {isString, isArray} from "core/util/types"

import type {UIElement} from "models/ui/ui_element"
import type {DOMNode} from "models/dom/dom_node"

declare type Jq = any
declare const $: Jq

export type ShowableRoot = UIElement | DOMNode
export type Showable = ShowableRoot | ShowableRoot[]

export type MountOptions = {
  signal?: AbortSignal
  /** DOM targets corresponding by index to the mounted document roots. */
  root_targets?: readonly (EmbedTarget | null)[]
}

export class BokehMount<T extends HasProps = HasProps> {
  constructor(
    readonly document: Document,
    private readonly _mount: StandaloneMount,
  ) {}

  get models(): readonly T[] {
    return this.document.roots() as T[]
  }

  get views(): ViewOf<T>[] {
    const roots = this.document.roots()
    return this._mount.views.roots.filter((view) => roots.includes(view.model)) as ViewOf<T>[]
  }

  get view_manager(): ViewManager {
    return this._mount.views
  }

  get disposed(): boolean {
    return this._mount.disposed
  }

  dispose(): void {
    this._mount.dispose()
  }
}

function as_document(obj: Document | Showable): {doc: Document, dispose_document: boolean} {
  if (obj instanceof Document) {
    return {doc: obj, dispose_document: false}
  } else {
    const models = isArray(obj) ? obj : [obj]
    const doc = new Document({roots: models})
    return {doc, dispose_document: true}
  }
}

async function resolve_target(target: EmbedTarget | string | undefined, script: HTMLScriptElement | SVGScriptElement | null): Promise<EmbedTarget> {
  await dom_ready()

  if (target == null) {
    if (script != null && contains(document.body, script)) {
      const parent = script.parentNode
      if (parent instanceof HTMLElement || parent instanceof DocumentFragment) {
        return parent
      }
    }

    return document.body
  } else if (isString(target)) {
    const found = document.querySelector(target)
    if (found instanceof HTMLElement) {
      return found.shadowRoot ?? found
    } else {
      throw new Error(`'${target}' selector didn't match any elements`)
    }
  } else if (target instanceof HTMLElement || target instanceof DocumentFragment) {
    return target
  } else if (typeof $ !== "undefined" && (target as any) instanceof $) {
    return (target as Jq)[0]
  } else {
    throw new Error("target should be a HTMLElement, DocumentFragment, string selector, $ or null")
  }
}

export async function mount<T extends UIElement | DOMNode>(obj: T, target?: EmbedTarget | string, options?: MountOptions): Promise<BokehMount<T>>
export async function mount<T extends UIElement | DOMNode>(obj: T[], target?: EmbedTarget | string, options?: MountOptions): Promise<BokehMount<T>>
export async function mount(obj: Document, target?: EmbedTarget | string, options?: MountOptions): Promise<BokehMount<HasProps>>
export async function mount(obj: Document | Showable, target?: EmbedTarget | string, options?: MountOptions): Promise<BokehMount>

export async function mount(obj: Document | Showable, target?: EmbedTarget | string, options: MountOptions = {}): Promise<BokehMount> {
  const script = document.currentScript // This needs to be evaluated before any `await` to avoid `null` value.
  const {doc, dispose_document} = as_document(obj)
  const {signal, root_targets} = options

  const abort_before_mount = () => {
    if (dispose_document) {
      doc.destroy()
    }
  }
  if (signal?.aborted == true) {
    abort_before_mount()
  } else {
    signal?.addEventListener("abort", abort_before_mount, {once: true})
  }

  try {
    const element = await resolve_target(target, script)
    if (signal?.aborted == true) {
      throw signal.reason ?? new Error("mount was aborted before rendering started")
    }

    signal?.removeEventListener("abort", abort_before_mount)
    const mounted = await mount_document_standalone(doc, element, {
      roots: root_targets != null ? [...root_targets] : undefined,
      signal,
      dispose_document,
    })
    return new BokehMount(doc, mounted)
  } catch (error) {
    if (dispose_document) {
      doc.destroy()
    }
    throw error
  } finally {
    signal?.removeEventListener("abort", abort_before_mount)
  }
}

export async function show<T extends UIElement | DOMNode>(obj: T, target?: EmbedTarget | string): Promise<ViewOf<T>>
export async function show<T extends UIElement | DOMNode>(obj: T[], target?: EmbedTarget | string): Promise<ViewOf<T>[]>
export async function show(obj: Document, target?: EmbedTarget | string): Promise<ViewOf<HasProps>[]>
export async function show(obj: UIElement | Document, target?: EmbedTarget | string): Promise<ViewOf<HasProps> | ViewOf<HasProps>[]>

export async function show(obj: Document | Showable, target?: EmbedTarget | string): Promise<ViewOf<HasProps> | ViewOf<HasProps>[]> {
  const mounted = await mount(obj, target)
  const {document: doc, views} = mounted

  return new Promise((resolve, _reject) => {
    const result = isArray(obj) || obj instanceof Document ? views : views[0]
    if (doc.is_idle) {
      resolve(result)
    } else {
      doc.idle.connect(() => resolve(result))
    }
  })
}
