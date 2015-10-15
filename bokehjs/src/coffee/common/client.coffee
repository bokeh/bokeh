_ = require "underscore"
{Promise} = require "es6-promise"
{logger} = require "./logging"
{Document, ModelChangedEvent, RootAddedEvent, RootRemovedEvent} = require "./document"
{HasProperties} = require "./has_properties"

DEFAULT_SERVER_WEBSOCKET_URL = "ws://localhost:5006/ws"
DEFAULT_SESSION_ID = "default"

class Message
  constructor : (@header, @metadata, @content) ->
    @buffers = []

  @assemble : (header_json, metadata_json, content_json) ->
    new Message(JSON.parse(header_json), JSON.parse(metadata_json), JSON.parse(content_json))

  @create_header : (msgtype, options) ->
    header = {
      'msgid'   : _.uniqueId()
      'msgtype' : msgtype
    }
    _.extend(header, options)

  @create : (msgtype, header_options, content) ->
    if not content?
      content = {}
    header = Message.create_header(msgtype, header_options)
    new Message(header, {}, content)

  send : (socket) ->
    header_json = JSON.stringify(@header)
    metadata_json = JSON.stringify(@metadata)
    content_json = JSON.stringify(@content)
    #console.log("h #{header_json} m #{metadata_json} c #{content_json}")
    socket.send(header_json)
    socket.send(metadata_json)
    socket.send(content_json)

  complete : ->
    if @header? and @metadata? and @content?
      if 'num_buffers' of @header
        @buffers.length == @header['num_buffers']
      else
        true
    else
      false

  add_buffer : (buffer) ->
    @buffers.push(buffer)

  _header_field : (field) ->
    if field of @header
      @header[field]
    else
      null

  msgid : () -> @_header_field('msgid')

  msgtype : () -> @_header_field('msgtype')

  sessid : () -> @_header_field('sessid')

  reqid : () -> @_header_field('reqid')

  # return the reason we should close on bad protocol, if there is one
  problem : () ->
    if 'msgid' not of @header
      "No msgid in header"
    else if 'msgtype' not of @header
      "No msgtype in header"
    else
      null

message_handlers = {
  'PATCH-DOC' : (connection, message) ->
    if not message.sessid()?
      connection._close_bad_protocol("No session ID in PATCH-DOC")
    connection._foreach_session_with_id message.sessid(), (session) ->
      session._handle_patch(message)

  'OK' : (connection, message) ->
    logger.debug("Unhandled OK reply to #{message.reqid()}")

  'ERROR' : (connection, message) ->
    logger.error("Unhandled ERROR reply to #{message.reqid()}: ${message.content['text']}")
}

class ClientConnection

  constructor : (url) ->
    if not url?
      url = DEFAULT_SERVER_WEBSOCKET_URL
    @url = url
    @socket = null
    @closed_permanently = false
    @_fragments = []
    @_partial = null
    @_current_handler = null
    @_pending_ack = null # null or [resolve,reject]
    @_pending_replies = {} # map reqid to [resolve,reject]
    @_sessions = [] # can be multiple per session id
    @_schedule_reconnect(0)

  register_session : (session) ->
    @_sessions.push(session)

  unregister_session : (session) ->
    i = @_sessions.indexOf(session)
    if i >= 0
      @_sessions.splice(i, 1)

  _foreach_session_with_id : (id, f) ->
     for s in @_sessions
      if s.id == id
        f(s)

  connect : () ->
    if @closed_permanently
      return Promise.reject(new Error("Cannot connect() a closed ClientConnection"))
    if @socket?
      return Promise.reject(new Error("Already connected"))

    @_fragments = []
    @_partial = null
    @_pending_replies = {}
    @_current_handler = null

    try
      versioned_url = "#{@url}?bokeh-protocol-version=1.0"
      if window.MozWebSocket?
        @socket = new MozWebSocket(versioned_url)
      else
        @socket = new WebSocket(versioned_url)

      new Promise (resolve, reject) =>
        # "arraybuffer" gives us binary data we can look at;
        # if we just needed an opaque blob we could use "blob"
        @socket.binarytype = "arraybuffer"
        @socket.onopen = () => @_on_open(resolve, reject)
        @socket.onmessage = (event) => @_on_message(event)
        @socket.onclose = (event) => @_on_close(event)
        @socket.onerror = () => @_on_error(reject)
    catch error
      logger.error("websocket creation failed to url: #{@url}")
      logger.error(" - #{error}")
      Promise.reject(error)

  close : () ->
    @closed_permanently = true
    if @socket?
      @socket.close(1000, "close method called on ClientConnection")

  _schedule_reconnect : (milliseconds) ->
    retry = () =>
      if @closed_permanently
        return
      else
        logger.debug("Attempting to reconnect websocket")
        @connect()
    setTimeout retry, milliseconds

  send : (message) ->
    message.send(@socket)

  send_with_reply : (message) ->
    promise = new Promise (resolve, reject) =>
      @_pending_replies[message.msgid()] = [resolve, reject]
      message.send(@socket)

    promise.then(
      (message) ->
        if message.msgtype() == 'ERROR'
          throw new Error("Error reply #{message.content['text']}")
        else
          message
      (error) ->
        throw error
    )

  _pull_doc_json : (session_id) ->
    message = Message.create('PULL-DOC-REQ', { sessid: session_id })
    promise = @send_with_reply(message)
    promise.then(
      (reply) ->
        if 'doc' not of reply.content
          throw new Error("No 'doc' field in PULL-DOC-REPLY")
        reply.content['doc']
      (error) ->
        throw error
    )

  # return a promise containing a ClientSession
  pull_session : (session_id) ->
    if not session_id?
      session_id = _.uniqueId()
    @_pull_doc_json(session_id).then(
      (doc_json) =>
        doc = Document.from_json(doc_json)
        new ClientSession(@, doc, session_id)
      (error) ->
        throw error
    )

  _repull_session_id : (session_id) ->
    logger.debug("Reloading session #{session_id}")
    @_pull_doc_json(session_id).then(
      (doc_json) =>
        @_foreach_session_with_id session_id, (session) ->
          session.document.replace_with_json(doc_json)
      (error) ->
        throw error
    )

  _on_open : (resolve, reject) ->
    logger.debug("Websocket connection is now open")
    @_pending_ack = [resolve, reject]
    @_current_handler = (message) =>
      @_awaiting_ack_handler(message)

  _on_message : (event) ->
    if not @_current_handler?
      logger.error("got a message but haven't set _current_handler")

    if event.data instanceof ArrayBuffer
      if @_partial? and not @_partial.complete()
        @_partial.add_buffer(event.data)
      else
        @_close_bad_protocol("Got binary from websocket but we were expecting text")
    else if @_partial?
      @_close_bad_protocol("Got text from websocket but we were expecting binary")
    else
      @_fragments.push(event.data)
      if @_fragments.length == 3
        @_partial = Message.assemble(@_fragments[0], @_fragments[1], @_fragments[2])
        @_fragments = []
        problem = @_partial.problem()
        if problem != null
          @_close_bad_protocol(problem)

    if @_partial? and @_partial.complete()
      msg = @_partial
      @_partial = null
      @_current_handler(msg)

  _on_close : (event) ->
    logger.info("Lost websocket connection, #{event.code} (#{event.reason})")
    @socket = null

    if @_pending_ack?
      @_pending_ack[1](new Error("Lost websocket connection, #{event.code} (#{event.reason})"))
      @_pending_ack = null

    pop_pending = () ->
      for reqid, promise_funcs of @_pending_replies
        delete @_pending_replies[reqid]
        return promise_funcs
      return null
    promise_funcs = pop_pending()
    while promise_funcs != null
      promise_funcs[1]("Disconnected")
      promise_funcs = pop_pending()
    if not @closed_permanently
      @_schedule_reconnect(2000)

  _on_error : (reject) ->
    logger.debug("Websocket error")
    reject(new Error("Could not open websocket"))

  _close_bad_protocol : (detail) ->
    logger.error("Closing connection: #{detail}")
    # 1002 = protocol error
    if @socket?
      @socket.close(1002, detail)

  _awaiting_ack_handler : (message) ->
    if message.msgtype() == "ACK"
      @_current_handler = (message) => @_steady_state_handler(message)

      # Reload any sessions
      # TODO (havocp) there's a race where we might get a PATCH before
      # we send and get a reply to our pulls.
      session_ids = {}
      for session in @_sessions
        session_ids[session.id] = true
      for id in Object.keys(session_ids)
        @_repull_session_id(id)

      if @_pending_ack?
        @_pending_ack[0](@)
        @_pending_ack = null

    else
      @_close_bad_protocol("First message was not an ACK")

  _steady_state_handler : (message) ->
    if message.reqid() of @_pending_replies
      promise_funcs = @_pending_replies[message.reqid()]
      delete @_pending_replies[message.reqid()]
      promise_funcs[0](message)
    else if message.msgtype() of message_handlers
      message_handlers[message.msgtype()](@, message)
    else
      logger.debug("Doing nothing with message #{message.msgtype()}")

class ClientSession

  constructor : (@connection, @document, @id) ->
    @_current_patch = null
    # we save the bound function so we can remove it later
    @document_listener = (event) => @_document_changed(event)
    @document.on_change(@document_listener)
    @connection.register_session(@)

  close : () ->
    @document.remove_on_change(@document_listener)
    @connection.unregister_session(@)

  _should_suppress_on_change : (patch, event) ->
    if event instanceof ModelChangedEvent
      for event_json in patch.content['events']
        if event_json['kind'] == 'ModelChanged' and event_json['model']['id'] == event.model.id and event_json['attr'] == event.attr
          patch_new = event_json['new']
          if event.new_ instanceof HasProperties
            if typeof patch_new == 'object' and 'id' of patch_new and patch_new['id'] == event.new_.id
              return true
          else if patch_new == event.new_
            return true
    else if event instanceof RootAddedEvent
        for event_json in patch.content['events']
          if event_json['kind'] == 'RootAdded' and event_json['model']['id'] == event.model.id
            return true
    else if event instanceof RootRemovedEvent
        for event_json in patch.content['events']
          if event_json['kind'] == 'RootRemoved' and event_json['model']['id'] == event.model.id
            return true

    return false

  _document_changed : (event) ->
    if @_current_patch? and @_should_suppress_on_change(@_current_patch, event)
      return

    patch = Message.create('PATCH-DOC', { sessid: @id },
      @document.create_json_patch([event]))
    @connection.send(patch)

  _handle_patch : (message) ->
    @_current_patch = message
    try
      @document.apply_json_patch(message.content)
    finally
      @_current_patch = null

module.exports =
  ClientConnection: ClientConnection
  ClientSession: ClientSession

