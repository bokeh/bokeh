import {Promise} from "es6-promise"

import {logger} from "core/logging"
import {ModelChangedEvent} from "document"
import {Message} from "protocol/message"

export class ClientSession

  constructor: (@_connection, @document, @id) ->
    # we save the bound function so we can remove it later
    @document_listener = (event) => @_document_changed(event)
    @document.on_change(@document_listener)

    @event_manager = @document.event_manager
    @event_manager.session = @

  handle: (message) ->
    msgtype = message.msgtype()

    if msgtype == 'PATCH-DOC'
      @_handle_patch(message)

    else if msgtype == 'OK'
      @_handle_ok(message)

    else if msgtype == 'ERROR'
      @_handle_error(message)

    else
      logger.debug("Doing nothing with message #{message.msgtype()}")

  close: () ->
    @_connection.close()

  send_event: (event) ->
    message = Message.create('EVENT', {}, JSON.stringify(event))
    @_connection.send(message)

  _connection_closed: () ->
    @document.remove_on_change(@document_listener)

  # Sends a request to the server for info about the server, such as its Bokeh
  # version. Returns a promise, the value of the promise is a free-form dictionary
  # of server details.
  request_server_info: () ->
    message = Message.create('SERVER-INFO-REQ', {})
    promise = @_connection.send_with_reply(message)
    promise.then((reply) -> reply.content)

  # Sends some request to the server (no guarantee about which one) and returns
  # a promise which is completed when the server replies. The purpose of this
  # is that if you wait for the promise to be completed, you know the server
  # has processed the request. This is useful when writing tests because once
  # the server has processed this request it should also have processed any
  # events or requests you sent previously, which means you can check for the
  # results of that processing without a race condition. (This assumes the
  # server processes events in sequence, which it mostly has to semantically,
  # since reordering events might change the final state.)
  force_roundtrip: () ->
    @request_server_info().then((ignored) -> undefined)

  _document_changed: (event) ->
    # Filter out events that were initiated by the ClientSession itself
    if event.setter_id == @id
      return

    # Filter out changes to attributes that aren't server-visible
    if event instanceof ModelChangedEvent and event.attr not of event.model.serializable_attributes()
      return

    # TODO (havocp) the connection may be closed here, which will
    # cause this send to throw an error - need to deal with it more cleanly.
    message = Message.create('PATCH-DOC', {}, @document.create_json_patch([event]))
    @_connection.send(message)

  _handle_patch: (message) ->
    @document.apply_json_patch(message.content, message.buffers, @id)

  _handle_ok: (message) ->
    logger.trace("Unhandled OK reply to #{message.reqid()}")

  _handle_error: (message) ->
    logger.error("Unhandled ERROR reply to #{message.reqid()}: #{message.content['text']}")
