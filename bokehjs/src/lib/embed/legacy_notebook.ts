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
import type {EmbedTarget} from "./standalone"

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
    root_targets.set(key, roots[i])
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

function _init_comms(target: string, root_id: string | undefined): {
  connect(doc: Document): void
  abort(): void
} {
  let doc: Document | null = null
  let aborted = false
  const pending: {receiver: Receiver, message: CommMessage}[] = []
  const receive = (receiver: Receiver, message: CommMessage) => {
    if (aborted) {
      return
    }
    if (doc == null) {
      pending.push({receiver, message})
    } else {
      _handle_notebook_comms.call(doc, receiver, message)
    }
  }

  if (typeof Jupyter !== "undefined" && Jupyter.notebook.kernel != null) {
    logger.info(`Registering Jupyter comms for target ${target}`)
    const comm_manager = Jupyter.notebook.kernel.comm_manager
    try {
      comm_manager.register_target(target, (comm: Comm) => {
        logger.info(`Registering Jupyter comms for target ${target}`)
        const r = new Receiver()
        comm.on_msg((message) => receive(r, message))
      })
    } catch (e) {
      logger.warn(`Jupyter comms failed to register. push_notebook() will not function. (exception reported: ${e})`)
    }
  } else if (root_id != null && root_id in kernels) {
    logger.info(`Registering JupyterLab comms for target ${target}`)
    const kernel = kernels[root_id] as Kernel
    try {
      kernel.registerCommTarget(target, (comm: Comm) => {
        logger.info(`Registering JupyterLab comms for target ${target}`)
        const r = new Receiver()
        comm.onMsg = (message) => receive(r, message)
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
          receive(r, msg)
        }
      })
    } catch (e) {
      logger.warn(`Google Colab comms failed to register. push_notebook() will not function. (exception reported: ${e})`)
    }
  } else {
    console.warn("Jupyter notebooks comms not available. push_notebook() will not function. If running JupyterLab ensure the latest @bokeh/jupyter_bokeh extension is installed. In an exported notebook this warning is expected.")
  }
  return {
    connect(document) {
      doc = document
      for (const {receiver, message} of pending) {
        _handle_notebook_comms.call(document, receiver, message)
      }
      pending.length = 0
    },
    abort() {
      aborted = true
      doc = null
      pending.length = 0
    },
  }
}

export async function embed_items_notebook(docs_json: DocsJson, render_items: RenderItem[],
    load_resources?: () => Promise<void>): Promise<void> {
  if (size(docs_json) != 1) {
    throw new Error("embed_items_notebook expects exactly one document in docs_json")
  }

  // The kernel can open the comm as soon as the display script runs.
  // Register before loading assets and retain patches until deserialization.
  const comms = render_items.flatMap((item) => {
    if (item.notebook_comms_target == null) {
      return []
    }
    const root_id = item.root_ids?.[0] ?? Object.keys(item.roots ?? {})[0]
    return [_init_comms(item.notebook_comms_target, root_id)]
  })
  try {
    if (load_resources != null) {
      await load_resources()
    }
    const document = Document.from_json(values(docs_json)[0])
    for (const comm of comms) {
      comm.connect(document)
    }
    for (const item of render_items) {
      const element = _resolve_element(item)
      const roots = _resolve_root_elements(item)

      await mount_document_standalone(document, element, {roots})

      for (const root of roots) {
        if (root instanceof HTMLElement) {
          root.removeAttribute("id")
        }
      }
    }
  } catch (error) {
    for (const comm of comms) {
      comm.abort()
    }
    for (const item of render_items) {
      const targets = [item.elementid, ...values(item.roots ?? {})]
      for (const target of targets) {
        const element = isString(target) ? window.document.getElementById(target) : target
        if (element != null) {
          const status = div({role: "alert"})
          status.textContent = `Bokeh notebook display failed: ${error instanceof Error ? error.message : String(error)}`
          element.replaceChildren(status)
        }
      }
    }
    throw error
  }
}
