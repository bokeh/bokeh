import {expect} from "assertions"

import {pull_session} from "@bokehjs/client/connection"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {unique_id} from "@bokehjs/core/util/string"

const port = 5877
const url = `ws://127.0.0.1:${port}/ws`

function token(session_id: string = unique_id(), session_expiry: number = Date.now() + 300) {
  return btoa(JSON.stringify({session_id, session_expiry})).replace(/=+$/, "")
}

describe("ClientSession", () => {

  it("should be able to connect", async () => {
    const session = await pull_session(url, token())
    session.close()
  })

  it("should pass request string to connection", async () => {
    const session = await pull_session(url, token(), "foo=10&bar=20")
    try {
      expect((session as any)._connection.args_string).to.be.equal("foo=10&bar=20") // XXX
    } finally {
      session.close()
    }
  })

  it("should be able to connect again", async () => {
    const session = await pull_session(url, token())
    session.close()
  })

  it("should get server info", async () => {
    const session = await pull_session(url, token())
    try {
      const info = await session.request_server_info()
      expect("version_info" in info).to.be.true
    } finally {
      session.close()
    }
  })

  it.skip("should sync a document between two connections", async () => {
    const session1 = await pull_session(url, token())
    try {
      const root = new Range1d({start: 123, end: 456})
      session1.document.add_root(root)
      session1.document.set_title("Hello Title")
      await session1.force_roundtrip()

      const session2 = await pull_session(url, token(session1.id))
      try {
        expect(session2.document.roots().length).to.be.equal(1)
        const root = session2.document.roots()[0]
        expect(root).to.be.instanceof(Range1d)
        const obj = root as Range1d
        expect(obj.start).to.be.equal(123)
        expect(obj.end).to.be.equal(456)
        expect(session2.document.title()).to.be.equal("Hello Title")
      } finally {
        session2.close()
      }
    } finally {
      session1.close()
    }
  })
})
