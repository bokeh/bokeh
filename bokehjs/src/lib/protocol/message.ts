import type {ID} from "../core/types"
import {Buffer} from "../core/serialization/buffer"
import {unique_id} from "../core/util/string"
import {isPlainObject, isString} from "../core/util/types"

export type Socket = {
  send(data: unknown): void
}

export type MessageType =
  | "ACK"
  | "ERROR"
  | "OK"
  | "PATCH-DOC"
  | "PULL-DOC-REPLY"
  | "PULL-DOC-REQ"
  | "PUSH-DOC"
  | "SYNC"

const message_types: ReadonlySet<string> = new Set<MessageType>([
  "ACK",
  "ERROR",
  "OK",
  "PATCH-DOC",
  "PULL-DOC-REPLY",
  "PULL-DOC-REQ",
  "PUSH-DOC",
  "SYNC",
])

function is_message_type(value: unknown): value is MessageType {
  return isString(value) && message_types.has(value)
}

export type Header = {
  msgid: string
  msgtype: MessageType
  reqid?: string
}

export type Envelope<T> = {
  header: Header
  content: T
  buffers: ID[]
}

const max_buffers_per_message = 10_000

export class Message<T> {
  constructor(readonly header: Header, readonly content: T, readonly buffers: Map<ID, ArrayBuffer> = new Map()) {}

  static decode<T>(envelope_json: string): Envelope<T> {
    const envelope: unknown = JSON.parse(envelope_json)
    if (!isPlainObject(envelope) || Object.keys(envelope).sort().join() != "buffers,content,header") {
      throw new Error("Message envelope must contain header, content, and buffers")
    }

    const {header, content, buffers} = envelope
    if (!isPlainObject(header) || !isString(header.msgid) || header.msgid.length == 0 || !is_message_type(header.msgtype)) {
      throw new Error("Message envelope has an invalid header")
    }
    if (header.reqid != null && !isString(header.reqid)) {
      throw new Error("Message envelope has an invalid request id")
    }
    if (Object.keys(header).some((key) => !["msgid", "msgtype", "reqid"].includes(key))) {
      throw new Error("Message header contains unknown fields")
    }
    if (!isPlainObject(content)) {
      throw new Error("Message content must be an object")
    }
    if (!Array.isArray(buffers) || !buffers.every((id) => isString(id) && id.length != 0)) {
      throw new Error("Message buffers must be a list of non-empty strings")
    }
    if (buffers.length > max_buffers_per_message) {
      throw new Error(`Message cannot contain more than ${max_buffers_per_message} buffers`)
    }
    if (new Set(buffers).size != buffers.length) {
      throw new Error("Message buffer ids must be unique")
    }

    const decoded_header: Header = {msgid: header.msgid, msgtype: header.msgtype}
    if (header.reqid != null) {
      decoded_header.reqid = header.reqid
    }
    return {header: decoded_header, content: content as T, buffers}
  }

  static create<T>(msgtype: MessageType, content: T): Message<T> {
    const header = Message.create_header(msgtype)
    return new Message(header, content)
  }

  static create_header(msgtype: MessageType): Header {
    return {
      msgid: unique_id(),
      msgtype,
    }
  }

  send(socket: Socket): void {
    const buffers: [ID, ArrayBuffer][] = []
    const buffer_ids: ID[] = []
    const envelope_json = JSON.stringify({header: this.header, content: this.content, buffers: buffer_ids}, (_, val) => {
      if (val instanceof Buffer) {
        const id = `${buffers.length}`
        buffer_ids.push(id)
        buffers.push([id, val.buffer])
        return {id}
      } else {
        return val
      }
    })
    if (buffers.length > max_buffers_per_message) {
      throw new Error(`Message cannot contain more than ${max_buffers_per_message} buffers`)
    }

    socket.send(envelope_json)

    for (const [, buffer] of buffers) {
      socket.send(buffer)
    }
  }

  msgid(): string {
    return this.header.msgid
  }

  msgtype(): MessageType {
    return this.header.msgtype
  }

  reqid(): string | undefined {
    return this.header.reqid
  }
}
