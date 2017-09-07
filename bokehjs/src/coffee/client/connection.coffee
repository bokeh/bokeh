import {Promise} from "es6-promise"

import {logger} from "core/logging"
import {Document} from "document"
import {Message} from "protocol/message"
import {Receiver} from "protocol/receiver"
import {ClientSession} from "./session"

export DEFAULT_SERVER_WEBSOCKET_URL = "ws://localhost:5006/ws"
export DEFAULT_SESSION_ID = "default"

export class ClientConnection

  @_connection_count: 0

  constructor: (@url, @id, @args_string, @_on_have_session_hook, @_on_closed_permanently_hook) ->
    @_number = ClientConnection._connection_count
    ClientConnection._connection_count = @_number + 1
    if not @url?
      @url = DEFAULT_SERVER_WEBSOCKET_URL
    if not @id?
      @id = DEFAULT_SESSION_ID

    logger.debug("Creating websocket #{@_number} to '#{@url}' session '#{@id}'")

    @socket = null
    @session = null
    @closed_permanently = false
    @_current_handler = null
    @_pending_ack = null # null or [resolve,reject]
    @_pending_replies = {} # map reqid to [resolve,reject]
    @_receiver = new Receiver()

  connect: () ->
    if @closed_permanently
      return Promise.reject(new Error("Cannot connect() a closed ClientConnection"))
    if @socket?
      return Promise.reject(new Error("Already connected"))

    @_pending_replies = {}
    @_current_handler = null

    try
      versioned_url = "#{@url}?bokeh-protocol-version=1.0&bokeh-session-id=#{@id}"
      if @args_string?.length > 0
        versioned_url += "&#{@args_string}"
      if window.MozWebSocket?
        @socket = new MozWebSocket(versioned_url)
      else
        @socket = new WebSocket(versioned_url)

      new Promise (resolve, reject) =>
        # "arraybuffer" gives us binary data we can look at;
        # if we just needed an opaque blob we could use "blob"
        @socket.binaryType = "arraybuffer"
        @socket.onopen = () => @_on_open(resolve, reject)
        @socket.onmessage = (event) => @_on_message(event)
        @socket.onclose = (event) => @_on_close(event)
        @socket.onerror = () => @_on_error(reject)
    catch error
      logger.error("websocket creation failed to url: #{@url}")
      logger.error(" - #{error}")
      Promise.reject(error)

  close: () ->
    if not @closed_permanently
      logger.debug("Permanently closing websocket connection #{@_number}")
      @closed_permanently = true
      if @socket?
        @socket.close(1000, "close method called on ClientConnection #{@_number}")
      @session._connection_closed()
      if @_on_closed_permanently_hook?
        @_on_closed_permanently_hook()
        @_on_closed_permanently_hook = null

  _schedule_reconnect: (milliseconds) ->
    retry = () =>
      # TODO "true or" below until we fix reconnection to repull
      # the document when required. Otherwise, we get a lot of
      # confusing errors that are causing trouble when debugging.
      if true or @closed_permanently
        if not @closed_permanently
          logger.info("Websocket connection #{@_number} disconnected, will not attempt to reconnect")
        return
      else
        logger.debug("Attempting to reconnect websocket #{@_number}")
        @connect()
    setTimeout retry, milliseconds

  send: (message) ->
    if @socket == null
      throw new Error("not connected so cannot send #{message}")
    message.send(@socket)

  send_with_reply: (message) ->
    promise = new Promise (resolve, reject) =>
      @_pending_replies[message.msgid()] = [resolve, reject]
      @send(message)

    promise.then(
      (message) ->
        if message.msgtype() == 'ERROR'
          throw new Error("Error reply #{message.content['text']}")
        else
          message
      (error) ->
        throw error
    )

  _pull_doc_json : () ->
    message = Message.create('PULL-DOC-REQ', {})
    promise = @send_with_reply(message)
    promise.then(
      (reply) ->
        if 'doc' not of reply.content
          throw new Error("No 'doc' field in PULL-DOC-REPLY")
        reply.content['doc']
      (error) ->
        throw error
    )

  _repull_session_doc : () ->
    if @session == null
      logger.debug("Pulling session for first time")
    else
      logger.debug("Repulling session")
    @_pull_doc_json().then(
      (doc_json) =>
        if @session == null
          if @closed_permanently
            logger.debug("Got new document after connection was already closed")
          else
            document = Document.from_json(doc_json)

            # Constructing models changes some of their attributes, we deal with that
            # here. This happens when models set attributes during construction
            # or initialization.
            patch = Document._compute_patch_since_json(doc_json, document)
            if patch.events.length > 0
              logger.debug("Sending #{patch.events.length} changes from model construction back to server")
              patch_message = Message.create('PATCH-DOC', {}, patch)
              @send(patch_message)

            @session = new ClientSession(@, document, @id)

            logger.debug("Created a new session from new pulled doc")
            if @_on_have_session_hook?
              @_on_have_session_hook(@session)
              @_on_have_session_hook = null
        else
          @session.document.replace_with_json(doc_json)
          logger.debug("Updated existing session with new pulled doc")
      (error) ->
        # handling the error here is useless because we wouldn't
        # get errors from the resolve handler above, so see
        # the catch below instead
        throw error
    ).catch (error) ->
      if console.trace?
        console.trace(error)
      logger.error("Failed to repull session #{error}")

  _on_open: (resolve, reject) ->
    logger.info("Websocket connection #{@_number} is now open")
    @_pending_ack = [resolve, reject]
    @_current_handler = (message) =>
      @_awaiting_ack_handler(message)

  _on_message: (event) ->
    if not @_current_handler?
      logger.error("Got a message with no current handler set")

    try
      @_receiver.consume(event.data)
    catch e
      @_close_bad_protocol(e.toString())

    if @_receiver.message == null
      return null

    msg = @_receiver.message

    problem = msg.problem()
    if problem != null
      @_close_bad_protocol(problem)

    @_current_handler(msg)

  _on_close: (event) ->
    logger.info("Lost websocket #{@_number} connection, #{event.code} (#{event.reason})")
    @socket = null

    if @_pending_ack?
      @_pending_ack[1](new Error("Lost websocket connection, #{event.code} (#{event.reason})"))
      @_pending_ack = null

    pop_pending = () =>
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

  _on_error: (reject) ->
    logger.debug("Websocket error on socket  #{@_number}")
    reject(new Error("Could not open websocket"))

  _close_bad_protocol: (detail) ->
    logger.error("Closing connection: #{detail}")
    if @socket?
      @socket.close(1002, detail) # 1002 = protocol error

  _awaiting_ack_handler: (message) ->
    if message.msgtype() == "ACK"
      @_current_handler = (message) => @_steady_state_handler(message)

      # Reload any sessions
      # TODO (havocp) there's a race where we might get a PATCH before
      # we send and get a reply to our pulls.
      @_repull_session_doc()

      if @_pending_ack?
        @_pending_ack[0](@)
        @_pending_ack = null

    else
      @_close_bad_protocol("First message was not an ACK")

  _steady_state_handler: (message) ->
    if message.reqid() of @_pending_replies
      promise_funcs = @_pending_replies[message.reqid()]
      delete @_pending_replies[message.reqid()]
      promise_funcs[0](message)
    else
      @session.handle(message)

# Returns a promise of a ClientSession
# The returned promise has a close() method in case you want to close before
# getting a session; session.close() works too once you have a session.
export pull_session = (url, session_id, args_string) ->
  rejecter = null
  connection = null
  promise = new Promise (resolve, reject) ->
    connection = new ClientConnection(url, session_id, args_string,
      (session) ->
        try
          resolve(session)
        catch e
          logger.error("Promise handler threw an error, closing session #{error}")
          session.close()
          throw e
      () ->
        # we rely on reject() as a no-op if we already resolved
        reject(new Error("Connection was closed before we successfully pulled a session")))
    connection.connect().then(
      (whatever) ->
      (error) ->
        logger.error("Failed to connect to Bokeh server #{error}")
        throw error
    )

  # add a "close" method to the promise... too weird?
  promise.close = () ->
    connection.close()
  promise
