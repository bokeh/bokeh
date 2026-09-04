import {createContext, createElement, useCallback, useContext, useEffect, useRef, useState} from "react"
import type {HTMLAttributes, ReactElement, ReactNode, RefCallback} from "react"

import type {BokehMount, MountOptions} from "@bokeh/bokehjs"
import {DocumentMountController, MountController} from "@bokeh/framework"
import type {BokehModel, BokehRootModel} from "@bokeh/framework"

/** Options and callbacks for a React-owned Bokeh mount. */
export type UseBokehOptions = {
  mountOptions?: MountOptions
  onMounted?(mounted: BokehMount): void
  onError?(error: unknown): void
}

/** Reactive state and target ref returned by `useBokeh()`. */
export type UseBokehResult = {
  ref: RefCallback<HTMLDivElement>
  mounted: BokehMount | null
  error: unknown
}

/** Mount a source into the returned ref and dispose it on dependency cleanup. */
export function useBokeh(model: BokehModel | null, options: UseBokehOptions = {}): UseBokehResult {
  const [target, setTarget] = useState<HTMLDivElement | null>(null)
  const [mounted, setMounted] = useState<BokehMount | null>(null)
  const [error, setError] = useState<unknown>(null)
  const callbacks = useRef(options)
  callbacks.current = options

  const ref = useCallback<RefCallback<HTMLDivElement>>((element) => setTarget(element), [])
  const signal = options.mountOptions?.signal

  useEffect(() => {
    if (model == null || target == null) {
      return
    }

    const controller = new MountController()
    setMounted(null)
    setError(null)
    void controller.start(model, target, {
      mountOptions: callbacks.current.mountOptions,
      onMounted: (handle) => {
        setMounted(handle)
        callbacks.current.onMounted?.(handle)
      },
      onDisposed: (handle) => {
        setMounted((current) => current == handle ? null : current)
      },
      onError: (reason) => {
        setError(reason)
        callbacks.current.onError?.(reason)
      },
    })

    return () => controller.dispose()
  }, [model, target, signal])

  return {ref, mounted, error}
}

export type BokehProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "onError"> & UseBokehOptions & {
  /** The Bokeh root, roots array, or document to render in one mount. */
  model: BokehModel
}

/** Render one React-owned target backed by a core `BokehMount`. */
export function Bokeh({model, mountOptions, onMounted, onError, ...attributes}: BokehProps): ReactElement {
  const {ref} = useBokeh(model, {mountOptions, onMounted, onError})
  return createElement("div", {...attributes, ref})
}

export type BokehDocumentProps = UseBokehOptions & {
  /** Roots that will be rendered by descendant BokehRoot slots in one shared document. */
  models: readonly BokehRootModel[]
  children?: ReactNode
}

const BokehDocumentContext = createContext<DocumentMountController | null>(null)

/** Provide one shared mount whose roots render through descendant `BokehRoot` slots. */
export function BokehDocument({models, mountOptions, onMounted, onError, children}: BokehDocumentProps): ReactElement {
  const controller = useRef<DocumentMountController | null>(null)
  controller.current ??= new DocumentMountController()
  const callbacks = useRef({onMounted, onError})
  callbacks.current = {onMounted, onError}
  const signal = mountOptions?.signal

  useEffect(() => {
    controller.current?.update(models, {
      mountOptions,
      onMounted: (mounted) => callbacks.current.onMounted?.(mounted),
      onError: (error) => callbacks.current.onError?.(error),
    })
  }, [models, signal])

  useEffect(() => () => controller.current?.dispose(), [])

  return createElement(BokehDocumentContext.Provider, {value: controller.current}, children)
}

export type BokehRootProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /** One root listed in the nearest BokehDocument's models property. */
  model: BokehRootModel
}

/** Attach one model from the nearest `BokehDocument` without replacing siblings. */
export function BokehRoot({model, ...attributes}: BokehRootProps): ReactElement {
  const controller = useContext(BokehDocumentContext)
  if (controller == null) {
    throw new Error("BokehRoot must be rendered inside a BokehDocument")
  }

  const detach = useRef<(() => void) | null>(null)
  const ref = useCallback<RefCallback<HTMLDivElement>>((target) => {
    detach.current?.()
    detach.current = target != null ? controller.attach(model, target) : null
  }, [controller, model])
  useEffect(() => () => detach.current?.(), [])

  return createElement("div", {...attributes, ref})
}
