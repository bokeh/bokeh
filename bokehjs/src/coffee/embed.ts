import * as base from "./base"
import {logger, set_log_level} from "./core/logging"
import {Document, DocJson, DocumentChangedEvent, RootAddedEvent, RootRemovedEvent, TitleChangedEvent} from "./document"
import {div, link, style, replaceWith} from "./core/dom"
import {defer} from "./core/util/callback"
import {unescape} from "./core/util/string"
import {size, values} from "./core/util/object"
import {isString} from "./core/util/types"
import {Receiver} from "./protocol/receiver"
import {ClientSession} from "./client/session"
import {pull_session} from "./client/connection"
import {HasProps} from "./core/has_props"
import {DOMView} from "./core/dom_view"

export type DocsJson = {[key: string]: DocJson}

export interface RenderItem {
  elementid: string
  docid?: string
  modelid?: string
  sessionid?: string
  use_for_title?: boolean
  notebook_comms_target?: any
}

export declare interface CommMessage {
  buffers: DataView[],
  content: {
    data: string
  }
}

export declare interface Comm {
  target_name: string
  on_msg: (msg: CommMessage) => void
  onMsg: (this: Document, receiver: Receiver, comm_msg: CommMessage) => void
}

export declare interface Kernel {
  comm_manager: {
    register_target: (target: string, fn: (comm: Comm) => void) => void,
  },
  registerCommTarget: (target: string, fn: (comm: Comm) => void) => void,
}

declare interface Jupyter {
  notebook: {
    kernel: Kernel | undefined
  }
}


declare var Jupyter: Jupyter | undefined

export const kernels: {[key: string]: Kernel} = {}

// Matches Bokeh CSS class selector. Setting all Bokeh parent element class names
// with this var prevents user configurations where css styling is unset.
export const BOKEH_ROOT = "bk-root"

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
    const kernel = kernels[doc.roots()[0].id]
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
    console.warn(`Jupyter notebooks comms not available. push_notebook() will not function. If running JupyterLab ensure the latest jupyterlab_bokeh extension is installed. In an exported notebook this warning is expected.`);
  }
}

function _create_view(model: HasProps): DOMView {
  const view = new model.default_view({model: model, parent: null}) as DOMView
  base.index[model.id] = view
  return view
}

function _get_element(item: RenderItem): HTMLElement {
  const element_id = item.elementid
  let elem = document.getElementById(element_id)

  if (elem == null)
    throw new Error(`Error rendering Bokeh model: could not find tag with id: ${element_id}`)
  if (!document.body.contains(elem))
    throw new Error(`Error rendering Bokeh model: element with id '${element_id}' must be under <body>`)

  // if autoload script, replace script tag with div for embedding
  if (elem.tagName == "SCRIPT") {
    fill_render_item_from_script_tag(elem, item)
    const container = div({class: BOKEH_ROOT})
    replaceWith(elem, container)
    const child = div()
    container.appendChild(child)
    elem = child
  }

  return elem
}

// Replace element with a view of model_id from document
export function add_model_standalone(model_id: string, element: HTMLElement, doc: Document): DOMView {
  const model = doc.get_model_by_id(model_id)
  if (model == null)
    throw new Error(`Model ${model_id} was not in document ${doc}`)
  const view = _create_view(model)
  view.renderTo(element, true)
  return view
}

// Fill element with the roots from doc
export function add_document_standalone(document: Document, element: HTMLElement, use_for_title: boolean = false): {[key: string]: DOMView} {
  // this is a LOCAL index of views used only by this particular rendering
  // call, so we can remove the views we create.
  const views: {[key: string]: DOMView} = {}

  function render_model(model: HasProps): void {
    const view = _create_view(model)
    view.renderTo(element)
    views[model.id] = view
  }

  function unrender_model(model: HasProps): void {
    if (model.id in views) {
      const view = views[model.id]
      element.removeChild(view.el)
      delete views[model.id]
      delete base.index[model.id]
    }
  }

  for (const model of document.roots())
    render_model(model)

  if (use_for_title)
    window.document.title = document.title()

  document.on_change((event: DocumentChangedEvent): void => {
    if (event instanceof RootAddedEvent)
      render_model(event.model)
    else if (event instanceof RootRemovedEvent)
      unrender_model(event.model)
    else if (use_for_title && event instanceof TitleChangedEvent)
      window.document.title = event.title
  })

  return views
}

// map { websocket url to map { session id to promise of ClientSession } }
const _sessions: {[key: string]: {[key: string]: Promise<ClientSession>}} = {}

function _get_session(websocket_url: string, session_id: string, args_string: string): Promise<ClientSession> {
  if (!(websocket_url in _sessions))
    _sessions[websocket_url] = {}

  const subsessions = _sessions[websocket_url]
  if (!(session_id in subsessions))
    subsessions[session_id] = pull_session(websocket_url, session_id, args_string)

  return subsessions[session_id]
}

// Fill element with the roots from session_id
export function add_document_from_session(element: HTMLElement,
    websocket_url: string, session_id: string, use_for_title: boolean): Promise<{[key: string]: DOMView}> {
  const args_string = window.location.search.substr(1)
  const promise = _get_session(websocket_url, session_id, args_string)
  return promise.then(
    (session: ClientSession) => {
      return add_document_standalone(session.document, element, use_for_title)
    },
    (error) => {
      logger.error(`Failed to load Bokeh session ${session_id}: ${error}`)
      throw error
    },
  )
}

// Replace element with a view of model_id from the given session
export function add_model_from_session(element: HTMLElement,
    websocket_url: string, model_id: string, session_id: string): Promise<DOMView> {
  const args_string = window.location.search.substr(1)
  const promise = _get_session(websocket_url, session_id, args_string)
  return promise.then(
    (session: ClientSession) => {
      const model = session.document.get_model_by_id(model_id)
      if (model == null)
        throw new Error(`Did not find model ${model_id} in session`)
      const view = _create_view(model)
      view.renderTo(element, true)
      return view
    },
    (error: Error) => {
      logger.error(`Failed to load Bokeh session ${session_id}: ${error}`)
      throw error
    },
  )
}

export function inject_css(url: string): void {
  const element = link({href: url, rel: "stylesheet", type: "text/css"})
  document.body.appendChild(element)
}

export function inject_raw_css(css: string): void {
  const element = style({}, css)
  document.body.appendChild(element)
}

// pull missing render item fields from data- attributes
function fill_render_item_from_script_tag(script: HTMLElement, item: RenderItem): void {
  const {bokehLogLevel, bokehDocId, bokehModelId, bokehSessionId} = script.dataset

  // length checks are because we put all the attributes on the tag
  // but sometimes set them to empty string
  if (bokehLogLevel != null && bokehLogLevel.length > 0)
    set_log_level(bokehLogLevel)
  if (bokehDocId != null && bokehDocId.length > 0)
    item.docid = bokehDocId
  if (bokehModelId != null && bokehModelId.length > 0)
    item.modelid = bokehModelId
  if (bokehSessionId != null && bokehSessionId.length > 0)
    item.sessionid = bokehSessionId

  logger.info(`Will inject Bokeh script tag with params ${JSON.stringify(item)}`)
}

export function embed_items_notebook(docs_json: DocsJson, render_items: RenderItem[]): void {
  if (size(docs_json) != 1)
    throw new Error("embed_items_notebook expects exactly one document in docs_json")

  const doc = Document.from_json(values(docs_json)[0])

  for (const item of render_items) {
    if (item.notebook_comms_target != null)
      _init_comms(item.notebook_comms_target, doc)

    const elem = _get_element(item)

    if (item.modelid != null)
      add_model_standalone(item.modelid, elem, doc)
    else
      add_document_standalone(doc, elem, false)
  }
}

function _get_ws_url(app_path: string | undefined, absolute_url: string | undefined): string {
  let protocol = 'ws:'
  if (window.location.protocol == 'https:')
    protocol = 'wss:'

  let loc: HTMLAnchorElement | Location
  if (absolute_url != null) {
    loc = document.createElement('a')
    loc.href = absolute_url
  } else
    loc = window.location

  if (app_path != null) {
    if (app_path == "/")
      app_path = ""
  } else
    app_path = loc.pathname.replace(/\/+$/, '')

  return protocol + '//' + loc.host + app_path + '/ws'
}

// TODO (bev) this is currently clunky. Standalone embeds only provide
// the first two args, whereas server provide the app_app, and *may* prove and
// absolute_url as well if non-relative links are needed for resources. This function
// should probably be split in to two pieces to reflect the different usage patterns
export function embed_items(docs_json: string | DocsJson, render_items: RenderItem[], app_path?: string, absolute_url?: string): void {
  defer(() => _embed_items(docs_json, render_items, app_path, absolute_url))
}

function _embed_items(docs_json: string | DocsJson, render_items: RenderItem[], app_path?: string, absolute_url?: string): void {
  if (isString(docs_json))
    docs_json = JSON.parse(unescape(docs_json)) as DocsJson

  const docs: {[key: string]: Document} = {}
  for (const docid in docs_json) {
    const doc_json = docs_json[docid]
    docs[docid] = Document.from_json(doc_json)
  }

  for (const item of render_items) {
    const elem = _get_element(item)
    const use_for_title = item.use_for_title != null && item.use_for_title

    // handle server session cases
    if (item.sessionid != null) {
      const websocket_url = _get_ws_url(app_path, absolute_url)
      logger.debug(`embed: computed ws url: ${websocket_url}`)
      let promise: Promise<any>
      if (item.modelid != null)
        promise = add_model_from_session(elem, websocket_url, item.modelid, item.sessionid)
      else
        promise = add_document_from_session(elem, websocket_url, item.sessionid, use_for_title)

      promise.then(
        () => {
          console.log("Bokeh items were rendered successfully")
        },
        (error: Error) => {
          console.log("Error rendering Bokeh items ", error)
        },
      )

    // handle standalone document cases
    } else if (item.docid != null) {
      if (item.modelid != null)
        add_model_standalone(item.modelid, elem, docs[item.docid])
      else
        add_document_standalone(docs[item.docid], elem, use_for_title)
    } else
       throw new Error(`Error rendering Bokeh items to element ${item.elementid}: no document ID or session ID specified`)
  }
}
