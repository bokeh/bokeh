$ = require "jquery"
_ = require "underscore"
Backbone = require "backbone"
{index} = require "./base"
HasProperties = require "./has_properties"
{logger, set_log_level} = require "./logging"
{Document, RootAddedEvent, RootRemovedEvent, TitleChangedEvent} = require "./document"
{pull_session} = require "./client"
{Promise} = require "es6-promise"

_create_view = (model) ->
  view = new model.default_view({model : model})
  index[model.id] = view
  view

# Replace element with a view of model_id from document
add_model_static = (element, model_id, doc) ->
  model = doc.get_model_by_id(model_id)
  if not model?
    throw new Error("Model #{model_id} was not in document #{doc}")
  view = _create_view(model)
  _.delay(-> $(element).replaceWith(view.$el))

_render_document_to_element = (element, document, use_for_title) ->
  # this is a LOCAL index of views used only by this
  # particular rendering call, so we can remove
  # the views we create.
  views = {}
  render_model = (model) ->
    view = _create_view(model)
    views[model.id] = view
    $(element).append(view.$el)
  unrender_model = (model) ->
    if model.id of views
      view = views[model.id]
      $(element).remove(view.$el)
      delete views[model.id]
      delete index[model.id]

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

# Fill element with the roots from doc
add_document_static = (element, doc, use_for_title) ->
  _.delay(-> _render_document_to_element($(element), doc, use_for_title))

_websocket_url = null

set_websocket_url = (url) ->
  _websocket_url = url

# map from session id to promise of ClientSession
_sessions = {}
_get_session = (session_id) ->
  if _websocket_url == null
    throw new Error("set_websocket_url was not called")

  if session_id not of _sessions
    _sessions[session_id] = pull_session(_websocket_url, session_id)

  _sessions[session_id]

# Fill element with the roots from session_id
add_document_from_session = (element, session_id, use_for_title) ->
  promise = _get_session(session_id)
  promise.then(
    (session) ->
      _render_document_to_element(element, session.document, use_for_title)
    (error) ->
      logger.error("Failed to load Bokeh session " + session_id + ": " + error)
      throw error
  )

# Replace element with a view of model_id from the given session
add_model_from_session = (element, model_id, session_id) ->
  promise = _get_session(session_id)
  promise.then(
    (session) ->
      model = session.document.get_model_by_id(model_id)
      if not model?
        throw new Error("Did not find model #{model_id} in session")
      view = _create_view(model)
      $(element).replaceWith(view.$el)
    (error) ->
      logger.error("Failed to load Bokeh session " + session_id + ": " + error)
      throw error
  )

inject_css = (url) ->
  link = $("<link href='#{url}' rel='stylesheet' type='text/css'>")
  $('body').append(link)

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

embed_items = (docs_json_or_id, render_items, websocket_url) ->
  if _.isString(docs_json_or_id)
    element = document.getElementById(docs_json_or_id)
    if not element
      throw new Error("element ##{docs_json_or_id} not found")
    if element.nodeName.toLowerCase() != "script" or element.getAttribute("type") != "text/x-bokeh"
      throw new Error("element ##{docs_json_or_id} must be a script with type='text/x-bokeh'")
    docs_json = JSON.parse(element.innerHTML)
  else if _.isObject(docs_json_or_id)
    docs_json = docs_json_or_id
  else
    throw new Error("expected a string identifier or an object")

  if websocket_url?
    set_websocket_url(websocket_url)

  docs = {}
  for docid of docs_json
    docs[docid] = Document.from_json(docs_json[docid])

  for item in render_items
    element_id = item['elementid']
    elem = $('#' + element_id);
    if elem.length == 0
      throw new Error("Error rendering Bokeh model: could not find tag with id: #{element_id}")
    if elem.length > 1
      throw new Error("Error rendering Bokeh model: found too many tags with id: #{element_id}")
    if not document.body.contains(elem[0])
      throw new Error("Error rendering Bokeh model: element with id '#{element_id}' must be under <body>")

    if elem.prop("tagName") == "SCRIPT"
      fill_render_item_from_script_tag(elem, item)
      container = $('<div>', {class: 'bokeh-container'})
      elem.replaceWith(container)
      elem = container

    use_for_title = item.use_for_title? and item.use_for_title

    promise = null
    if item.modelid?
      if item.docid?
        add_model_static(elem, item.modelid, docs[item.docid])
      else if item.sessionid?
        promise = add_model_from_session(elem, item.modelid, item.sessionid)
      else
        throw new Error("Error rendering Bokeh model #{item['modelid']} to element #{element_id}: no document ID or session ID specified")
    else
      if item.docid?
         add_document_static(elem, docs[item.docid], use_for_title)
      else if item.sessionid?
         promise = add_document_from_session(elem, item.sessionid, use_for_title)
      else
        throw new Error("Error rendering Bokeh document to element #{element_id}: no document ID or session ID specified")

    if promise != null
      promise.then(
        (value) ->
          console.log("Bokeh items were rendered successfully")
        (error) ->
          console.log("Error rendering Bokeh items ", error)
      )

module.exports =
  embed_items: embed_items
  inject_css: inject_css
