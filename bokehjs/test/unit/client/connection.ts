// XXX node.js compat shim for WebSocket
(global as any).WebSocket = require("websocket").w3cwebsocket

import * as chai from "chai"
import * as chai_as_promised from "chai-as-promised"
chai.use(chai_as_promised)
const {expect} = chai

import {pull_session} from "@bokehjs/client/connection"
import {Range1d} from "@bokehjs/models/ranges/range1d"

import {with_server, server_timeout_millis} from "./with_server"

describe("ClientSession", function() {
  // It takes time to spin up the server so without this things get
  // flaky on Travis. Lengthen if we keep getting Travis failures.
  // The default (at least when this comment was written) was
  // 2000ms.
  this.timeout(server_timeout_millis)

  it("should be able to connect", async () => {
    const promise = with_server(async (url) => {
      const session = await pull_session(url)
      session.close()
      return "OK"
    })
    return expect(promise).eventually.to.equal("OK")
  })

  it("should pass request string to connection", async () => {
    const promise = with_server(async (url) => {
      const session = await pull_session(url, undefined, "foo=10&bar=20")
      try {
        expect((session as any)._connection.args_string).to.be.equal("foo=10&bar=20") // XXX
      } finally {
        session.close()
      }
      return "OK"
    })
    return expect(promise).eventually.to.equal("OK")
  })

  it("should be able to connect again", async () => {
    const promise = with_server(async (url) => {
      const session = await pull_session(url)
      session.close()
      return "OK"
    })
    return expect(promise).eventually.to.equal("OK")
  })

  it("should get server info", async () => {
    const promise = with_server(async (url) => {
      const session = await pull_session(url)
      try {
        const info = await session.request_server_info()
        expect(info).to.have.property('version_info')
      } finally {
        session.close()
      }
      return "OK"
    })
    return expect(promise).eventually.to.equal("OK")
  })

  it("should sync a document between two connections", async () => {
    const promise = with_server(async (url) => {
      const session1 = await pull_session(url)
      try {
        const root = new Range1d({start: 123, end: 456})
        session1.document.add_root(root)
        session1.document.set_title("Hello Title")
        await session1.force_roundtrip()

        const session2 = await pull_session(url, session1.id)
        try {
          expect(session2.document.roots().length).to.equal(1)
          const root = session2.document.roots()[0]
          expect(root).instanceof(Range1d)
          const obj = root as Range1d
          expect(obj.start).to.equal(123)
          expect(obj.end).to.equal(456)
          expect(session2.document.title()).to.equal("Hello Title")
        } finally {
          session2.close()
        }
      } finally {
        session1.close()
      }
      return "OK"
    })
    return expect(promise).eventually.to.equal("OK")
  })
})
