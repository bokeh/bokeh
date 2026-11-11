"use client"

import {createElement, useEffect, useRef} from "react"
import type {ReactElement, ReactNode} from "react"

import type {ClientSession} from "@bokeh/bokehjs"
import {SessionMountController} from "@bokeh/framework"
import type {BokehSessionSource} from "@bokeh/framework"

import {BokehDocumentContext} from "./context.js"
import type {UseBokehOptions} from "./mount.js"

export type BokehSessionProps = UseBokehOptions & {
  /** Borrow an existing session or acquire a connection owned by this provider. */
  source: BokehSessionSource
  /** Called when the session document is available, before root rendering. */
  onSession?(session: ClientSession): void
  children?: ReactNode
}

/** Provide one live document whose roots render through descendant `BokehRoot` slots. */
export function BokehSession({source, mountOptions, onSession, onMounted, onError, children}: BokehSessionProps): ReactElement {
  const controller = useRef<SessionMountController | null>(null)
  controller.current ??= new SessionMountController()
  const callbacks = useRef({onSession, onMounted, onError})
  callbacks.current = {onSession, onMounted, onError}
  useEffect(() => {
    controller.current?.update(source, {
      mountOptions,
      onSession: (session) => callbacks.current.onSession?.(session),
      onMounted: (mounted) => callbacks.current.onMounted?.(mounted),
      onError: (error) => callbacks.current.onError?.(error),
    })
  }, [source, mountOptions])

  useEffect(() => () => controller.current?.dispose(), [])

  return createElement(BokehDocumentContext.Provider, {value: controller.current}, children)
}
