import * as _ from "underscore"
import {Promise} from "es6-promise"

import * as base from "./base"
import {pull_session} from "./client"
import {logger, set_log_level} from "./core/logging"
import {Document, RootAddedEvent, RootRemovedEvent, TitleChangedEvent} from "./document"
import {div, link, style, replaceWith} from "./core/dom"

# Matches Bokeh CSS class selector. Setting all Bokeh parent element class names
# with this var prevents user configurations where css styling is unset.
export BOKEH_ROOT = "bk-root"

_handle_notebook_comms = (msg) ->
  logger.debug("handling notebook comms")
  # @ is bound to the doc
  data = JSON.parse(msg.content.data)
  if 'events' of data and 'references' of data
    @apply_json_patch(data)
  else if 'doc' of data
    @replace_with_json(data['doc'])
  else
    throw new Error("handling notebook comms message: ", msg)

_update_comms_callback = (target, doc, comm) ->
  if target == comm.target_name
    comm.on_msg(_handle_notebook_comms.bind(doc))

_init_comms = (target, doc) ->
  if Jupyter? and Jupyter.notebook.kernel?
    logger.info("Registering Jupyter comms for target #{target}")
    comm_manager = Jupyter.notebook.kernel.comm_manager
    update_comms = _.partial(_update_comms_callback, target, doc)
    for id, promise of comm_manager.comms
      promise.then(update_comms)
    try
      comm_manager.register_target(target, (comm, msg) ->
        logger.info("Registering Jupyter comms for target #{target}")
        comm.on_msg(_handle_notebook_comms.bind(doc))
      )
    catch e
      logger.warn("Jupyter comms failed to register. push_notebook() will not function. (exception reported: #{e})")
  else
    console.warn('Jupyter notebooks comms not available. push_notebook() will not function');

_create_view = (model) ->
  view = new model.default_view({model : model})
  base.index[model.id] = view
  view

_render_document_to_element = (element, document, use_for_title) ->
  # this is a LOCAL index of views used only by this
  # particular rendering call, so we can remove
  # the views we create.
  views = {}
  render_model = (model) ->
    view = _create_view(model)
    views[model.id] = view
    element.appendChild(view.el)
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

# Replace element with a view of model_id from document
add_model_static = (element, model_id, doc) ->
  model = doc.get_model_by_id(model_id)
  if not model?
    throw new Error("Model #{model_id} was not in document #{doc}")
  view = _create_view(model)
  _.delay(-> replaceWith(element, view.el))

# Fill element with the roots from doc
export add_document_static = (element, doc, use_for_title) ->
  _.delay(-> _render_document_to_element(element, doc, use_for_title))

export add_document_standalone = (document, element, use_for_title=false) ->
  return _render_document_to_element(element, document, use_for_title)

# map { websocket url to map { session id to promise of ClientSession } }
_sessions = {}
_get_session = (websocket_url, session_id) ->
  if not websocket_url? or websocket_url == null
    throw new Error("Missing websocket_url")
  if websocket_url not of _sessions
    _sessions[websocket_url] = {}
  subsessions = _sessions[websocket_url]
  if session_id not of subsessions
    subsessions[session_id] = pull_session(websocket_url, session_id)

  subsessions[session_id]

# Fill element with the roots from session_id
add_document_from_session = (element, websocket_url, session_id, use_for_title) ->
  promise = _get_session(websocket_url, session_id)
  promise.then(
    (session) ->
      _render_document_to_element(element, session.document, use_for_title)
    (error) ->
      logger.error("Failed to load Bokeh session " + session_id + ": " + error)
      throw error
  )

# Replace element with a view of model_id from the given session
add_model_from_session = (element, websocket_url, model_id, session_id) ->
  promise = _get_session(websocket_url, session_id)
  promise.then(
    (session) ->
      model = session.document.get_model_by_id(model_id)
      if not model?
        throw new Error("Did not find model #{model_id} in session")
      view = _create_view(model)
      replaceWith(element, view.el)
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
  info = script.data()
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

export embed_items = (docs_json, render_items, websocket_url=null) ->
  docs = {}
  for docid of docs_json
    docs[docid] = Document.from_json(docs_json[docid])

  for item in render_items

    if item.notebook_comms_target?
      _init_comms(item.notebook_comms_target, docs[docid])

    element_id = item['elementid']
    elem = document.getElementById(element_id)
    if not elem?
      throw new Error("Error rendering Bokeh model: could not find tag with id: #{element_id}")
    if not document.body.contains(elem)
      throw new Error("Error rendering Bokeh model: element with id '#{element_id}' must be under <body>")

    if elem.tagName == "SCRIPT"
      fill_render_item_from_script_tag(elem, item)
      container = div({class: BOKEH_ROOT})
      replaceWith(elem, container)
      child = div()
      container.appendChild(child)
      elem = child

    use_for_title = item.use_for_title? and item.use_for_title

    promise = null
    if item.modelid?
      if item.docid?
        add_model_static(elem, item.modelid, docs[item.docid])
      else if item.sessionid?
        promise = add_model_from_session(elem, websocket_url, item.modelid, item.sessionid)
      else
        throw new Error("Error rendering Bokeh model #{item['modelid']} to element #{element_id}: no document ID or session ID specified")
    else
      if item.docid?
         add_document_static(elem, docs[item.docid], use_for_title)
      else if item.sessionid?
         promise = add_document_from_session(elem, websocket_url, item.sessionid, use_for_title)
      else
        throw new Error("Error rendering Bokeh document to element #{element_id}: no document ID or session ID specified")

    if promise != null
      promise.then(
        (value) ->
          console.log("Bokeh items were rendered successfully")
        (error) ->
          console.log("Error rendering Bokeh items ", error)
      )
