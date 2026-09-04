import type {DocJson, Patch} from "document"
import {Document} from "document"
import {div, contains} from "core/dom"
import {Receiver} from "protocol/receiver"
import type {Message} from "protocol/message"
import type {ID} from "core/types"
import {logger} from "core/logging"
import {size, values} from "core/util/object"
import {isString} from "core/util/types"

import {StandaloneMount} from "./standalone"

type EmbedTarget = HTMLElement | DocumentFragment
type DocsJson = {[key: string]: DocJson}
type Roots = {[index: string]: ID | EmbedTarget}

interface RenderItem {
  docid?: string
  token?: string
  elementid?: string
  roots?: Roots
  root_ids?: ID[]
  use_for_title?: boolean
  notebook_comms_target?: string
}

function _get_element(target: ID | EmbedTarget): EmbedTarget {
  let element = isString(target) ? document.getElementById(target) : target
  if (element == null) {
    throw new Error(`Error rendering Bokeh model: could not find ${isString(target) ? `#${target}` : target} HTML tag`)
  }
  if (!contains(document.body, element)) {
    throw new Error(`Error rendering Bokeh model: element ${isString(target) ? `#${target}` : target} must be under <body>`)
  }
  if (element instanceof HTMLElement && element.tagName == "SCRIPT") {
    const root_el = div()
    element.replaceWith(root_el)
    element = root_el
  }
  return element
}

function _resolve_element(item: RenderItem): EmbedTarget {
  return item.elementid != null ? _get_element(item.elementid) : document.body
}

function _resolve_root_elements(item: RenderItem): EmbedTarget[] {
  const roots: EmbedTarget[] = []
  if (item.root_ids != null && item.roots != null) {
    for (const root_id of item.root_ids) {
      roots.push(_get_element(item.roots[root_id]))
    }
  }
  return roots
}

async function mount_document_standalone(document: Document, element: EmbedTarget,
    options: {roots?: EmbedTarget[]} = {}): Promise<void> {
  const {roots = []} = options
  const root_map = new Map(document.roots().map((model) => [model.id, model]))
  const root_targets = new Map<string, EmbedTarget>()
  for (const [i, key] of [...root_map.keys()].entries()) {
    const target = roots[i]
    if (target != null) {
      root_targets.set(key, target)
    }
  }
  const mount = new StandaloneMount(document, root_map, false, undefined, undefined, true)
  await mount.initialize(element, root_targets, false)
}

// This exists to allow the @bokeh/jupyter_bokeh extension to store the
// notebook kernel so that _init_comms can register the comms target.
// This has to be available at Bokeh.embed.kernels in JupyterLab.
export const kernels: {[key: string]: unknown} = {}

function _handle_notebook_comms(this: Document, receiver: Receiver, comm_msg: CommMessage): void {
  if (comm_msg.buffers.length > 0) {
    receiver.consume(comm_msg.buffers[0].buffer)
  } else {
    receiver.consume(comm_msg.content.data)
  }

  const msg = receiver.message
  if (msg != null) {
    this.apply_json_patch((msg as Message<Patch>).content, msg.buffers)
  }
}

function _init_comms(target: string, doc: Document): void {
  if (typeof Jupyter !== "undefined" && Jupyter.notebook.kernel != null) {
    logger.info(`Registering Jupyter comms for target ${target}`)
    const comm_manager = Jupyter.notebook.kernel.comm_manager
    try {
      comm_manager.register_target(target, (comm: Comm) => {
        logger.info(`Registering Jupyter comms for target ${target}`)
        const r = new Receiver()
        comm.on_msg(_handle_notebook_comms.bind(doc, r))
      })
    } catch (e) {
      logger.warn(`Jupyter comms failed to register. push_notebook() will not function. (exception reported: ${e})`)
    }
  } else if (doc.roots()[0].id in kernels) {
    logger.info(`Registering JupyterLab comms for target ${target}`)
    const kernel = kernels[doc.roots()[0].id] as Kernel
    try {
      kernel.registerCommTarget(target, (comm: Comm) => {
        logger.info(`Registering JupyterLab comms for target ${target}`)
        const r = new Receiver()
        comm.onMsg = _handle_notebook_comms.bind(doc, r)
      })
    } catch (e) {
      logger.warn(`Jupyter comms failed to register. push_notebook() will not function. (exception reported: ${e})`)
    }
  } else if  (typeof google != "undefined" && google.colab.kernel != null) {
    logger.info(`Registering Google Colab comms for target ${target}`)
    const comm_manager = google.colab.kernel.comms
    try {
      comm_manager.registerTarget(target, async (comm: google.colab.Comm) => {
        logger.info(`Registering Google Colab comms for target ${target}`)
        const r = new Receiver()
        for await (const message of comm.messages) {
          const content = {data: message.data}
          const buffers = []
          for (const buffer of message.buffers ?? []) {
            buffers.push(new DataView(buffer))
          }
          const msg = {content, buffers}
          _handle_notebook_comms.bind(doc)(r, msg)
        }
      })
    } catch (e) {
      logger.warn(`Google Colab comms failed to register. push_notebook() will not function. (exception reported: ${e})`)
    }
  } else {
    console.warn("Jupyter notebooks comms not available. push_notebook() will not function. If running JupyterLab ensure the latest @bokeh/jupyter_bokeh extension is installed. In an exported notebook this warning is expected.")
  }
}

export async function embed_items_notebook(docs_json: DocsJson, render_items: RenderItem[]): Promise<void> {
  if (size(docs_json) != 1) {
    throw new Error("embed_items_notebook expects exactly one document in docs_json")
  }

  const document = Document.from_json(values(docs_json)[0])

  for (const item of render_items) {
    if (item.notebook_comms_target != null) {
      _init_comms(item.notebook_comms_target, document)
    }

    const element = _resolve_element(item)
    const roots = _resolve_root_elements(item)

    await mount_document_standalone(document, element, {roots})

    for (const root of roots) {
      if (root instanceof HTMLElement) {
        root.removeAttribute("id")
      }
    }
  }
}
