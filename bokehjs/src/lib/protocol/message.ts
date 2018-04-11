import {uniqueId} from "core/util/string"

export interface Header {
  msgid?: string
  msgtype?: string
  reqid?: string
  num_buffers?: number
}

export class Message {

  readonly buffers: [Header, any][] = []

  constructor(readonly header: Header, readonly metadata: any, readonly content: any) {}

  static assemble(header_json: string, metadata_json: string, content_json: string): Message {
    const header = JSON.parse(header_json)
    const metadata = JSON.parse(metadata_json)
    const content = JSON.parse(content_json)
    return new Message(header, metadata, content)
  }

  assemble_buffer(buf_header: Header, buf_payload: any): void {
    const nb = this.header.num_buffers != null ? this.header.num_buffers : 0
    if (nb <= this.buffers.length)
      throw new Error("too many buffers received, expecting #{nb}")
    this.buffers.push([buf_header, buf_payload])
  }

  // not defined for BokehJS, only *receiving* buffers is supported
  // add_buffer: (buf_header, buf_payload) ->
  // write_buffers: (socket)

  static create(msgtype: string, metadata: any, content: any = {}): Message {
    const header = Message.create_header(msgtype)
    return new Message(header, metadata, content)
  }

  static create_header(msgtype: string): Header {
    return {
      msgid:   uniqueId(),
      msgtype: msgtype,
    }
  }

  complete(): boolean {
    if (this.header != null && this.metadata != null && this.content != null) {
      if ('num_buffers' in this.header)
        return this.buffers.length === this.header.num_buffers
      else
        return true
    } else
      return false
  }

  send(socket: WebSocket): void {
    const nb = this.header.num_buffers != null ? this.header.num_buffers : 0
    if (nb > 0)
      throw new Error("BokehJS only supports receiving buffers, not sending")
    const header_json = JSON.stringify(this.header)
    const metadata_json = JSON.stringify(this.metadata)
    const content_json = JSON.stringify(this.content)
    socket.send(header_json)
    socket.send(metadata_json)
    socket.send(content_json)
  }

  msgid(): string {
    return this.header.msgid!
  }

  msgtype(): string {
    return this.header.msgtype!
  }

  reqid(): string {
    return this.header.reqid!
  }

  // return the reason we should close on bad protocol, if there is one
  problem(): string | null {
    if (!('msgid' in this.header))
      return "No msgid in header"
    else if (!('msgtype' in this.header))
      return "No msgtype in header"
    else
      return null
  }
}
