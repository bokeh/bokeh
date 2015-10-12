$ = require "jquery"
_ = require "underscore"
Backbone = require "backbone"
base = require "../common/base"
HasProperties = require "../common/has_properties"
{logger} = require "../common/logging"
{Document, RootAddedEvent, RootRemovedEvent} = require "../common/document"
{ClientConnection} = require "../common/client"

inject_css = (url) ->
  link = $("<link href='#{url}' rel='stylesheet' type='text/css'>")
  $('body').append(link)

# Replace element with a view of model_id from document
add_model_static = (element, model_id, doc) ->
  model = doc.get_model_by_id(model_id)
  if not model?
    throw new Error("Model #{model_id} was not in document #{doc}")
  view = new model.default_view({model : model})
  _.delay(-> $(element).replaceWith(view.$el))

_render_document_to_element = (element, document) ->
  # this is a LOCAL index of views used only by this
  # particular rendering call, so we can remove
  # the views we create.
  views = {}
  render_model = (model) ->
    view = new model.default_view(model : model)
    views[model.id] = view
    $(element).append(view.$el)
  unrender_model = (model) ->
    if model.id of views
      view = views[model.id]
      $(element).remove(view.$el)
      delete views[model.id]

  for model in document.roots()
    render_model(model)

  document.on_change (event) ->
    if event instanceof RootAddedEvent
      render_model(event.model)
    else if event instanceof RootRemovedEvent
      unrender_model(event.model)

# Fill element with the roots from doc
add_document_static = (element, doc) ->
  _.delay(-> _render_document_to_element($(element), doc))

_connection = null
_get_connection = () ->
  if not _connection?
    _connection = new ClientConnection()
  _connection

# map from session id to promise of ClientSession
_sessions = {}
_get_session = (session_id) ->
  if session_id not of _sessions
    _sessions[session_id] = _get_connection().pull_session(session_id)

  _sessions[session_id]

# Fill element with the roots from session_id
add_document_from_session = (element, session_id) ->
  promise = _get_session(session_id)
  promise.then(
    (session) ->
      _render_document_to_element(element, session.document)
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
      view = new model.default_view({model : model})
      $(element).replaceWith(view.$el)
    (error) ->
      logger.error("Failed to load Bokeh session " + session_id + ": " + error)
      throw error
  )

inject_model = (element_id, model_id, doc) ->
  script = $("#" + element_id)
  if script.length == 0
    throw new Error("Error injecting model: could not find script tag with id:
                    #{element_id}")
  if script.length > 1
    throw new Error("Error injecting model: found too many script tags with id:
                    #{element_id}")
  if not document.body.contains(script[0])
    throw new Error(
      "Error injecting model: autoload script tag may only be under <body>")
  info = script.data()
  Bokeh.set_log_level(info['bokehLoglevel'])
  logger.info("Injecting model for script tag with id: #" + element_id)
  base.Config.prefix = info['bokehRootUrl']
  container = $('<div>', {class: 'bokeh-container'})
  container.insertBefore(script)
  if info.bokehData == "static"
    logger.info("  - using static data")
    add_model_static(container, info["bokehModelid"], doc)
  else if info.bokehData == "server"
    logger.info("  - using server data")
    add_model_from_session(container, info["bokehModelid"], info["bokehSessionid"])
  else
    throw new Error(
      "Unknown bokehData value for inject_model: #{info.bokehData}")

module.exports =
  inject_css: inject_css
  inject_model: inject_model
  add_model_from_session: add_model_from_session
  add_document_from_session: add_document_from_session
  add_model_static: add_model_static
  add_document_static: add_document_static
