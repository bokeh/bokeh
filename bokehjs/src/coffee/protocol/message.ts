import {uniqueId} from "core/util/string"

export class Message

  constructor: (@header, @metadata, @content) ->
    @buffers = []

  @assemble: (header_json, metadata_json, content_json) ->
    header = JSON.parse(header_json)
    metadata = JSON.parse(metadata_json)
    content = JSON.parse(content_json)
    return new Message(header, metadata, content)

  assemble_buffer: (buf_header, buf_payload) ->
    nb = if @header.num_buffers? then @header.num_buffers else 0
    if nb <= @buffers.length
      throw new Error("too many buffers received, expecting #{nb}")
    @buffers.push([buf_header, buf_payload])

  # not defined for BokehJS, only *receiving* buffers is supported
  # add_buffer: (buf_header, buf_payload) ->
  # write_buffers: (socket)

  @create: (msgtype, metadata, content) ->
    if not content?
      content = {}
    header = Message.create_header(msgtype)
    return new Message(header, metadata, content)

  @create_header: (msgtype) ->
    return {
      'msgid'   : uniqueId()
      'msgtype' : msgtype
    }

  complete: () ->
    if @header? and @metadata? and @content?
      if 'num_buffers' of @header
        return @buffers.length == @header['num_buffers']
      else
        return true
    else
      return false

  send: (socket) ->
    nb = if @header.num_buffers? then @header.num_buffers else 0
    if nb > 0
      throw new Error("BokehJS only supports receiving buffers, not sending")
    header_json = JSON.stringify(@header)
    metadata_json = JSON.stringify(@metadata)
    content_json = JSON.stringify(@content)
    socket.send(header_json)
    socket.send(metadata_json)
    socket.send(content_json)

  msgid: () -> @header['msgid']
  msgtype: () -> @header['msgtype']
  reqid: () -> @header['reqid']

  # return the reason we should close on bad protocol, if there is one
  problem: () ->
    if 'msgid' not of @header
      return "No msgid in header"
    else if 'msgtype' not of @header
      return "No msgtype in header"
    else
      return null
