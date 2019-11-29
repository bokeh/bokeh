import chai from "chai"
import chai_as_promised from "chai-as-promised"
chai.use(chai_as_promised)
const {expect} = chai

import {pull_session} from "@bokehjs/client/connection"
import {Range1d} from "@bokehjs/models/ranges/range1d"

describe("ClientSession", () => {

  it.with_server("should be able to connect", async (url) => {
    const session = await pull_session(url)
    session.close()
  })

  it.with_server("should pass request string to connection", async (url) => {
    const session = await pull_session(url, undefined, "foo=10&bar=20")
    try {
      expect((session as any)._connection.args_string).to.be.equal("foo=10&bar=20") // XXX
    } finally {
      session.close()
    }
  })

  it.with_server("should be able to connect again", async (url) => {
    const session = await pull_session(url)
    session.close()
  })

  it.with_server("should get server info", async (url) => {
    const session = await pull_session(url)
    try {
      const info = await session.request_server_info()
      expect(info).to.have.property('version_info')
    } finally {
      session.close()
    }
  })

  it.with_server("should sync a document between two connections", async (url) => {
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
  })
})
