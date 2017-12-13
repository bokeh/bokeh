import * as base from "./base"
import {pull_session} from "./client/connection"
import {logger, set_log_level} from "./core/logging"
import {Document, RootAddedEvent, RootRemovedEvent, TitleChangedEvent} from "./document"
import {div, link, style, replaceWith} from "./core/dom"
import {defer} from "./core/util/callback"
import {unescape} from "./core/util/string"
import {size, values} from "./core/util/object"
import {isString} from "./core/util/types"
import {Receiver} from "./protocol/receiver"

# Matches Bokeh CSS class selector. Setting all Bokeh parent element class names
# with this var prevents user configurations where css styling is unset.
export BOKEH_ROOT = "bk-root"

_handle_notebook_comms = (receiver, msg) ->
  if msg.buffers.length > 0
    receiver.consume(msg.buffers[0].buffer)
  else
    receiver.consume(msg.content.data)
  msg = receiver.message
  if msg?
    @apply_json_patch(msg.content, msg.buffers)

_update_comms_callback = (target, doc, comm) ->
  if target == comm.target_name
    r = new Receiver()
    comm.on_msg(_handle_notebook_comms.bind(doc, r))

_init_comms = (target, doc) ->
  if Jupyter? and Jupyter.notebook.kernel?
    logger.info("Registering Jupyter comms for target #{target}")
    comm_manager = Jupyter.notebook.kernel.comm_manager
    update_comms = (comm) -> _update_comms_callback(target, doc, comm)
    for id, promise of comm_manager.comms
      promise.then(update_comms)
    try
      comm_manager.register_target(target, (comm, msg) ->
        logger.info("Registering Jupyter comms for target #{target}")
        r = new Receiver()
        comm.on_msg(_handle_notebook_comms.bind(doc, r))
      )
    catch e
      logger.warn("Jupyter comms failed to register. push_notebook() will not function. (exception reported: #{e})")
  else
    console.warn('Jupyter notebooks comms not available. push_notebook() will not function');

_create_view = (model) ->
  view = new model.default_view({model: model, parent: null})
  base.index[model.id] = view
  view

_get_element = (item) ->
  element_id = item['elementid']
  elem = document.getElementById(element_id)
  if not elem?
    throw new Error("Error rendering Bokeh model: could not find tag with id: #{element_id}")
  if not document.body.contains(elem)
    throw new Error("Error rendering Bokeh model: element with id '#{element_id}' must be under <body>")

  # if autoload script, replace script tag with div for embedding
  if elem.tagName == "SCRIPT"
    fill_render_item_from_script_tag(elem, item)
    container = div({class: BOKEH_ROOT})
    replaceWith(elem, container)
    child = div()
    container.appendChild(child)
    elem = child

  return elem

# Replace element with a view of model_id from document
export add_model_standalone = (model_id, element, doc) ->
  model = doc.get_model_by_id(model_id)
  if not model?
    throw new Error("Model #{model_id} was not in document #{doc}")
  view = _create_view(model)
  view.renderTo(element, true)

# Fill element with the roots from doc
export add_document_standalone = (document, element, use_for_title=false) ->
  # this is a LOCAL index of views used only by this particular rendering
  # call, so we can remove the views we create.
  views = {}
  render_model = (model) ->
    view = _create_view(model)
    view.renderTo(element)
    views[model.id] = view
  unrender_model = (model) ->
    if model.id of views
      view = views[model.id]
      element.removeChild(view.el)
      delete views[model.id]
      delete base.index[model.id]

  for model in document.roots()
    render_model(model)

  if use_for_title
    window.document.title = document.title()

  document.on_change (event) ->
    if event instanceof RootAddedEvent
      render_model(event.model)
    else if event instanceof RootRemovedEvent
      unrender_model(event.model)
    else if use_for_title and event instanceof TitleChangedEvent
      window.document.title = event.title

  return views

# map { websocket url to map { session id to promise of ClientSession } }
_sessions = {}
_get_session = (websocket_url, session_id, args_string) ->
  if not websocket_url?
    throw new Error("Missing websocket_url")
  if websocket_url not of _sessions
    _sessions[websocket_url] = {}
  subsessions = _sessions[websocket_url]
  if session_id not of subsessions
    subsessions[session_id] = pull_session(websocket_url, session_id, args_string)

  subsessions[session_id]

# Fill element with the roots from session_id
add_document_from_session = (element, websocket_url, session_id, use_for_title) ->
  args_string = window.location.search.substr(1)
  promise = _get_session(websocket_url, session_id, args_string)
  promise.then(
    (session) ->
      add_document_standalone(session.document, element, use_for_title)
    (error) ->
      logger.error("Failed to load Bokeh session " + session_id + ": " + error)
      throw error
  )

# Replace element with a view of model_id from the given session
add_model_from_session = (element, websocket_url, model_id, session_id) ->
  args_string = window.location.search.substr(1)
  promise = _get_session(websocket_url, session_id, args_string)
  promise.then(
    (session) ->
      model = session.document.get_model_by_id(model_id)
      if not model?
        throw new Error("Did not find model #{model_id} in session")
      view = _create_view(model)
      view.renderTo(element, true)
    (error) ->
      logger.error("Failed to load Bokeh session " + session_id + ": " + error)
      throw error
  )

export inject_css = (url) ->
  element = link({href: url, rel: "stylesheet", type: "text/css"})
  document.body.appendChild(element)

export inject_raw_css = (css) ->
  element = style({}, css)
  document.body.appendChild(element)

# pull missing render item fields from data- attributes
fill_render_item_from_script_tag = (script, item) ->
  info = script.dataset
  # length checks are because we put all the attributes on the tag
  # but sometimes set them to empty string
  if info.bokehLogLevel? and info.bokehLogLevel.length > 0
    set_log_level(info.bokehLogLevel)
  if info.bokehDocId? and info.bokehDocId.length > 0
    item['docid'] = info.bokehDocId
  if info.bokehModelId? and info.bokehModelId.length > 0
    item['modelid'] = info.bokehModelId
  if info.bokehSessionId? and info.bokehSessionId.length > 0
    item['sessionid'] = info.bokehSessionId

  logger.info("Will inject Bokeh script tag with params #{JSON.stringify(item)}")

export embed_items_notebook = (docs_json, render_items) ->
  if size(docs_json) != 1
    throw new Error("embed_items_notebook expects exactly one document in docs_json")

  doc = Document.from_json(values(docs_json)[0])

  for item in render_items

    if item.notebook_comms_target?
      _init_comms(item.notebook_comms_target, doc)

    elem = _get_element(item)

    if item.modelid?
      add_model_standalone(item.modelid, elem, doc)
    else
      add_document_standalone(doc, elem, false)

_get_ws_url = (app_path, absolute_url) ->
  protocol = 'ws:'
  if (window.location.protocol == 'https:')
    protocol = 'wss:'

  if absolute_url?
    loc = document.createElement('a')
    loc.href = absolute_url
  else
    loc = window.location

  if app_path?
    if app_path == "/"
      app_path = ""
  else
    app_path = loc.pathname.replace(/\/+$/, '')

  return protocol + '//' + loc.host + app_path + '/ws'

# TODO (bev) this is currently clunky. Standalone embeds only provide
# the first two args, whereas server provide the app_app, and *may* prove and
# absolute_url as well if non-relative links are needed for resources. This function
# should probably be split in to two pieces to reflect the different usage patterns
export embed_items = (docs_json, render_items, app_path, absolute_url) ->
  defer(() -> _embed_items(docs_json, render_items, app_path, absolute_url))

_embed_items = (docs_json, render_items, app_path, absolute_url) ->
  if isString(docs_json)
    docs_json = JSON.parse(unescape(docs_json))

  docs = {}
  for docid of docs_json
    docs[docid] = Document.from_json(docs_json[docid])

  for item in render_items
    elem = _get_element(item)

    use_for_title = item.use_for_title? and item.use_for_title

    # handle server session cases
    if item.sessionid?
      websocket_url = _get_ws_url(app_path, absolute_url)
      logger.debug("embed: computed ws url: #{websocket_url}")
      if item.modelid?
        promise = add_model_from_session(elem, websocket_url, item.modelid, item.sessionid)
      else
        promise = add_document_from_session(elem, websocket_url, item.sessionid, use_for_title)

      promise.then(
        (value) ->
          console.log("Bokeh items were rendered successfully")
        (error) ->
          console.log("Error rendering Bokeh items ", error)
      )

    # handle standalone document cases
    else if item.docid?
      if item.modelid?
        add_model_standalone(item.modelid, elem, docs[item.docid])
      else
        add_document_standalone(docs[item.docid], elem, use_for_title)

    else
       throw new Error("Error rendering Bokeh items to element #{item.elementid}: no document ID or session ID specified")
