import {Document} from "../document"
import {DocumentChangedEvent, ModelChangedEvent} from "../document/events"
import {Receiver, Fragment} from "../protocol/receiver"
import {logger} from "../core/logging"
import {size, keys, values} from "../core/util/object"

import {add_document_standalone} from "./standalone"
import {DocsJson, RenderItem} from "./json"
import {_resolve_element, _resolve_root_elements} from "./dom"

import {DOMWidgetModel, DOMWidgetView, ISerializers} from "@jupyter-widgets/base"
import {version} from "../version"

import "styles/logo"
import "styles/notebook"

// This exists to allow the jupyterlab_bokeh extension to store the
// notebook kernel so that _init_comms can register the comms target.
// This has to be available at window.Bokeh.embed.kernels in JupyterLab.
export const kernels: {[key: string]: unknown} = {}

function _handle_notebook_comms(this: Document, receiver: Receiver, comm_msg: CommMessage): void {
  if (comm_msg.buffers.length > 0)
    receiver.consume(comm_msg.buffers[0].buffer)
  else
    receiver.consume(comm_msg.content.data)

  const msg = receiver.message
  if (msg != null)
    this.apply_json_patch(msg.content, msg.buffers)
}

function _init_comms(target: string, doc: Document): void {
  if (typeof Jupyter !== 'undefined' && Jupyter.notebook.kernel != null) {
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
  } else {
    console.warn(`Jupyter notebooks comms not available. push_notebook() will not function. If running JupyterLab ensure the latest jupyterlab_bokeh extension is installed. In an exported notebook this warning is expected.`)
  }
}

export function embed_items_notebook(docs_json: DocsJson, render_items: RenderItem[]): void {
  if (size(docs_json) != 1)
    throw new Error("embed_items_notebook expects exactly one document in docs_json")

  const document = Document.from_json(values(docs_json)[0])

  for (const item of render_items) {
    if (item.notebook_comms_target != null)
      _init_comms(item.notebook_comms_target, document)

    const element = _resolve_element(item)
    const roots = _resolve_root_elements(item)

    add_document_standalone(document, element, roots)
  }
}

export class BokehModel extends DOMWidgetModel {
  defaults(): object {
    return {
      ...super.defaults(),
      _model_name: BokehModel.model_name,
      _model_module: BokehModel.model_module,
      _model_module_version: BokehModel.model_module_version,
      _view_name: BokehModel.view_name,
      _view_module: BokehModel.view_module,
      _view_module_version: BokehModel.view_module_version,
      render_bundle: {},
    }
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
  }

  static model_name = "BokehModel"
  static model_module = "bokehjs"
  static model_module_version = version
  static view_name = "BokehView"
  static view_module = "bokehjs"
  static view_module_version = version
}

export type RenderBundle = {
  docs_json: DocsJson
  render_items: RenderItem[]
  div: string
}

export class BokehView extends DOMWidgetView {
  private _document: Document | null
  private _receiver: Receiver
  private _blocked: boolean

  constructor(options?: any) {
    super(options)
    this._document = null
    this._blocked = false
    this._receiver = new Receiver()
    this.model.on("change:render_bundle", () => this.render())
    this.listenTo(this.model, "msg:custom", (msg) => this._consume_patch(msg))
  }

  render(): void {
    const bundle = JSON.parse(this.model.get("render_bundle"))
    const {docs_json, render_items, div} = bundle as RenderBundle
    this.el.innerHTML = div
    const element = this.el.children[0]
    const json = values(docs_json)[0]
    this._document = Document.from_json(json)
    for (const item of render_items) {
      const roots: {[key: string]: HTMLElement} = {}
      for (const root_id in item.roots)
        roots[root_id] = element
      add_document_standalone(this._document, element, roots)
    }
    this._document.on_change((event) => this._change_event(event))
  }

  protected _change_event(event: DocumentChangedEvent): void {
    if (!this._blocked && event instanceof ModelChangedEvent)
      this.send({event: "jsevent", id: event.model.id, new: event.new_, attr: event.attr, old: event.old})
  }

  protected _consume_patch(content: {msg: "patch", payload: Fragment}): void {
    if (this._document == null)
      return
    if (content.msg == "patch") {
      this._receiver.consume(content.payload)
      const comm_msg = this._receiver.message
      if (comm_msg != null && keys(comm_msg.content).length > 0) {
        this._blocked = true
        try {
          this._document.apply_json_patch(comm_msg.content, comm_msg.buffers)
        } finally {
          this._blocked = false
        }
      }
    }
  }
}
