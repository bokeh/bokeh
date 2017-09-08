import {Message} from "protocol/message"

export class Receiver

  constructor: () ->
    @message = null
    @_current_consumer = @_HEADER

  consume: (fragment) ->
    @_current_consumer(fragment)
    return null

  _HEADER: (fragment) ->
    @_assume_text(fragment)
    @message = null
    @_partial = null
    @_fragments = [fragment]
    @_buf_header = null
    @_current_consumer = @_METADATA
    return null

  _METADATA: (fragment) ->
    @_assume_text(fragment)
    @_fragments.push(fragment)
    @_current_consumer = @_CONTENT
    return null

  _CONTENT: (fragment) ->
    @_assume_text(fragment)
    @_fragments.push(fragment)
    [header_json, metadata_json, content_json] = @_fragments.slice(0, 3)
    @_partial = Message.assemble(header_json, metadata_json, content_json)
    @_check_complete()
    return null

  _BUFFER_HEADER: (fragment) ->
    @_assume_text(fragment)
    @_buf_header = fragment
    @_current_consumer = @_BUFFER_PAYLOAD
    return null

  _BUFFER_PAYLOAD: (fragment) ->
    @_assume_binary(fragment)
    @_partial.assemble_buffer(@_buf_header, fragment)
    @_check_complete()
    return null

  _assume_text: (fragment) ->
    if fragment instanceof ArrayBuffer
      throw new Error("Expected text fragment but received binary fragment")

  _assume_binary: (fragment) ->
    if fragment not instanceof ArrayBuffer
      throw new Error("Expected binary fragment but received text fragment")

  _check_complete: () ->
    if @_partial.complete()
      @message = @_partial
      @_current_consumer = @_HEADER
    else
      @_current_consumer = @_BUFFER_HEADER
    return null
