import {Document} from "../document"
import {add_document_standalone} from "../embed/standalone"
import type {EmbedTarget} from "../embed/dom"

import type {ViewOf} from "core/view"
import type {HasProps} from "core/has_props"
import {dom_ready, contains} from "core/dom"
import {isString, isArray} from "core/util/types"

import type {UIElement} from "models/ui/ui_element"

declare type Jq = any
declare const $: Jq

export async function show<T extends UIElement>(obj: T, target?: EmbedTarget | string): Promise<ViewOf<T>>
export async function show<T extends UIElement>(obj: T[], target?: EmbedTarget | string): Promise<ViewOf<T>[]>
export async function show(obj: Document, target?: EmbedTarget | string): Promise<ViewOf<HasProps>[]>
export async function show(obj: UIElement | Document, target?: EmbedTarget | string): Promise<ViewOf<HasProps> | ViewOf<HasProps>[]>

export async function show(obj: Document | UIElement | UIElement[], target?: EmbedTarget | string): Promise<ViewOf<HasProps> | ViewOf<HasProps>[]> {
  const doc = (() => {
    if (obj instanceof Document) {
      return obj
    } else {
      const doc = new Document()

      for (const item of isArray(obj) ? obj : [obj]) {
        doc.add_root(item)
      }

      return doc
    }
  })()

  const script = document.currentScript // This needs to be evaluated before any `await` to avoid `null` value.
  await dom_ready()

  const element = ((): EmbedTarget => {
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
        if (found.shadowRoot != null) {
          return found.shadowRoot
        } else {
          return found
        }
      } else {
        throw new Error(`'${target}' selector didn't match any elements`)
      }
    } else if (target instanceof HTMLElement) {
      return target
    } else if (typeof $ !== "undefined" && target instanceof $) {
      return (target as Jq)[0]
    } else {
      throw new Error("target should be a HTMLElement, string selector, $ or null")
    }
  })()

  const view_manager = await add_document_standalone(doc, element)

  return new Promise((resolve, _reject) => {
    const views = [...view_manager]
    const result = isArray(obj) || obj instanceof Document ? views : views[0]
    if (doc.is_idle) {
      resolve(result)
    } else {
      doc.idle.connect(() => resolve(result))
    }
  })
}
