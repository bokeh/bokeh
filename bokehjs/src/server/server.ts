// XXX: for core/util/eq
// XXX: for core/util/platform
declare global {
  // @ts-ignore
  type Node = any
  // @ts-ignore
  const Node: Node
  // @ts-ignore
  const navigator: any
}

import type {IncomingMessage} from "http"
import WebSocket from "ws"
import yargs from "yargs"

import {version} from "./package.json"
import {Receiver} from "./receiver"
import {Message} from "./message"
import {isString} from "core/util/types"
// import {Document} from "document/document"

class Document {}

type Token = {
  session_expiry: number
  session_id: string
  [key: string]: unknown
}

function parse_token(token: string): Token {
  let payload = token.split(".")[0]
  const mod = payload.length % 4
  if (mod != 0) {
    payload += "=".repeat(4-mod)
  }
  payload = payload.replace(/_/g, "/").replace(/-/g, "+")
  const json = Buffer.from(payload, "base64").toString()
  return JSON.parse(json)
}

type ID = string

type ModelRep = {
  id: string
  type: string
  attributes: {[key: string]: unknown}
}

type DocJson = {
  version?: string
  title?: string
  //defs?: ModelDef[]
  roots: ModelRep[]
}

type VersionInfo = {
  bokeh: string
  server: string
}

type ServerInfo = {
  version_info: VersionInfo
}

type PullDoc = {
  doc: DocJson
}

const TOKEN = Symbol("TOKEN")
type Request = IncomingMessage & {[TOKEN]?: string}

const argv = yargs(process.argv.slice(2)).options({
  host: {type: "string", default: "127.0.0.1"},
  port: {type: "number", default: 5877},
}).parseSync()

const {host, port} = argv

function log(_message: string): void {
  //console.log(message)
}

const wss = new WebSocket.Server({
  host,
  port,
  handleProtocols: (protocols, request: Request) => {
    if (protocols.size == 2) {
      const [bokeh, token] = protocols
      if (bokeh == "bokeh") {
        request[TOKEN] = token
        return "bokeh"
      }
    }

    return false
  },
})

class ServerSession {
  constructor(readonly id: ID, readonly document: Document = new Document()) {}
}

const sessions: Map<ID, ServerSession> = new Map()

wss.on("connection", (ws, req: Request) => {
  ws.binaryType = "arraybuffer"

  const token = req[TOKEN]
  if (ws.protocol != "bokeh" || token == null) {
    ws.close()
    return
  }

  const {session_id, session_expiry} = parse_token(token)

  if (Date.now() > session_expiry) {
    ws.close()
    return
  }

  const session = (() => {
    const session = sessions.get(session_id)
    if (session != null) {
      return session
    } else {
      const session = new ServerSession(session_id)
      sessions.set(session_id, session)
      return session
    }
  })()

  const receiver = new Receiver()
  log(`Connected to session ${session.id}`)

  const ack = Message.create("ACK", {}, {})
  ack.send(ws)

  ws.addEventListener("message", (event) => {
    const {data, type} = event
    log(`received: ${data} ${type}`)
    if (isString(data) || data instanceof ArrayBuffer) {
      receiver.consume(data)
    } else {
      ws.close()
      return
    }

    const msg = receiver.message
    if (msg != null) {
      const reply = (() => {
        switch (msg.msgtype()) {
          case "PULL-DOC-REQ":
            return Message.create<PullDoc>("PULL-DOC-REPLY", {}, {
              doc: {
                version,
                title: "NodeJS application",
                roots: [],
              },
            })
          case "PUSH-DOC":
            return Message.create("OK", {}, {})
          case "PATCH-DOC":
            return Message.create("OK", {}, {})
          case "SERVER-INFO-REQ": {
            return Message.create<ServerInfo>("SERVER-INFO-REPLY", {}, {
              version_info: {bokeh: version, server: version},
            })
          }
          default:
            return null
        }
      })()

      if (reply != null) {
        reply.header.reqid = msg.msgid()
        reply.send(ws)
      }
    }
  })

  ws.addEventListener("error", (event) => {
    const {message} = event
    log(`Client errored: ${message}`)
  })

  ws.addEventListener("close", (event) => {
    const {code, reason} = event
    log(`Client disconnected (${code}): ${reason}`)
  })
})

const address = `ws://${host}:${port}`

console.log(`BokehJS server ${version} listening on ${address}`)
process.send?.("ready")
