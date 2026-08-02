import {createElement, useCallback, useEffect, useRef, useState} from "react"
import type {HTMLAttributes, ReactElement, RefCallback} from "react"

import type {BokehMount, MountOptions} from "@bokeh/bokehjs"
import {MountController} from "@bokeh/framework"
import type {BokehModel} from "@bokeh/framework"

export type UseBokehOptions = {
  mountOptions?: MountOptions
  onMounted?(mounted: BokehMount): void
  onError?(error: unknown): void
}

export type UseBokehResult = {
  ref: RefCallback<HTMLDivElement>
  mounted: BokehMount | null
  error: unknown
}

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
  model: BokehModel
}

export function Bokeh({model, mountOptions, onMounted, onError, ...attributes}: BokehProps): ReactElement {
  const {ref} = useBokeh(model, {mountOptions, onMounted, onError})
  return createElement("div", {...attributes, ref})
}
