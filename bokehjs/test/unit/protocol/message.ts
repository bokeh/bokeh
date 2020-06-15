import {expect} from "assertions"

import {Message} from "@bokehjs/protocol/message"
import {wildcard} from "@bokehjs/core/util/eq"

class MockSock {
  readonly sent: string[] = []

  send(data: string): void {
    this.sent.push(data)
  }
}

describe("protocol/message module", () => {

  describe("Message", () => {

    describe("assemble method", () => {

      it("should create new Messages from JSON", () => {
        const m = Message.assemble('{"msgid": "10", "msgtype": "FOO"}', '{"bar":2}', '{"baz":3}')
        expect(m).to.be.instanceof(Message)
        expect(m.complete()).to.be.true

        expect(m.header).to.be.equal({msgid: '10', msgtype: 'FOO'})
        expect(m.metadata).to.be.equal({bar:2})
        expect(m.content).to.be.equal({baz:3})
        expect(m.buffers).to.be.equal(new Map())
      })
    })

    describe("assemble_buffer method", () => {
      const m = Message.create("FOO", {bar:2}, {baz:3})
      m.header.num_buffers = 2

      it("should append a new buffer", () => {
        const buf0 = new ArrayBuffer(0)
        const buf1 = new ArrayBuffer(1)

        m.assemble_buffer('{"id": "1"}', buf0)
        expect([...m.buffers.entries()]).to.be.equal([["1", buf0]])

        m.assemble_buffer('{"id": "3"}', buf1)
        expect([...m.buffers.entries()]).to.be.equal([["1", buf0], ["3", buf1]])
      })

      it("should raise an error if num_buffers is exceeded", () => {
        expect(() => m.assemble_buffer('{"id": "5"}', new ArrayBuffer(2))).to.throw()
      })
    })

    describe("create method", () => {
      const m = Message.create("FOO", {bar:2}, {baz:3})

      it("should return a complete Message", () => {
        expect(m).to.be.instanceof(Message)
        expect(m.complete()).to.be.true
      })

      it("with a generated header", () => {
        const {header} = m
        expect(header).to.be.equal({msgid: wildcard, msgtype: "FOO"})
      })

      it("and metadata and content as-is", () => {
        expect(m.metadata).to.be.equal({bar:2})
        expect(m.content).to.be.equal({baz:3})
      })

      it("and no buffers", () => {
        expect(m.buffers).to.be.equal(new Map())
      })
    })

    describe("create_header method", () => {
      const h = Message.create_header("FOO")

      it("should return a header obj", () => {
        expect(h).to.be.equal({msgid: wildcard, msgtype: "FOO"})
      })

      it("should generate new ids", () => {
        const h2 = Message.create_header("FOO")
        expect(h.msgid).to.not.be.equal(h2.msgid)
      })
    })

    describe("complete method", () => {

      it("should return false if header is missing", () => {
        const m = Message.assemble('null', '{"bar":2}', '{"baz":3}')
        expect(m.complete()).to.be.false
      })

      it("should return false if content is missing", () => {
        const m = Message.assemble('{"msgid": "10", "msgtype": "FOO"}', 'null', '{"baz":3}')
        expect(m.complete()).to.be.false
      })

      it("should return false if metadata is missing", () => {
        const m = Message.assemble('{"msgid": "10", "msgtype": "FOO"}', '{"bar":2}', 'null')
        expect(m.complete()).to.be.false
      })

      it("should return true if num_buffers matches", () => {
        const m0 = Message.assemble('{"msgid": "10", "msgtype": "FOO"}', '{"bar":2}', '{"baz":3}')
        expect(m0.complete()).to.be.true

        const m1 = Message.assemble('{"msgid": "10", "msgtype": "FOO", "num_buffers": 1}', '{"bar":2}', '{"baz":3}')
        m1.assemble_buffer('{"id": "11"}', new ArrayBuffer(0))
        expect(m1.complete()).to.be.true
      })

      it("should return false if num_buffers does not match", () => {
        const m = Message.assemble('{"msgid": "10", "msgtype": "FOO", "num_buffers": 1}', '{"bar":2}', '{"baz":3}')
        expect(m.complete()).to.be.false
      })
    })

    describe("send method", () => {

      it("should send header, metadata, and content as JSON, in order", () => {
        const m = Message.assemble('{"msgid": "10", "msgtype": "FOO"}', '{"bar":2}', '{"baz":3}')
        const s = new MockSock()
        m.send(s)
        expect(s.sent.length).to.be.equal(3)
        expect(JSON.parse(s.sent[0])).to.be.equal({msgid: "10", msgtype: "FOO"})
        expect(JSON.parse(s.sent[1])).to.be.equal({bar:2})
        expect(JSON.parse(s.sent[2])).to.be.equal({baz:3})
      })

      /* XXX: ???
      it("should raise an error if num_buffers is not zero or missing ", () => {
        const m = Message.assemble('{"msgid": "10", "msgtype": "FOO"}', '{"bar":2}', '{"baz":3}')
        const m = Message.assemble('{"msgid": "10", "msgtype": "FOO", "num_buffers": 0}', '{"bar":2}', '{"baz":3}')
        const m = Message.assemble('{"msgid": "10", "msgtype": "FOO", "num_buffers": 1}', '{"bar":2}', '{"baz":3}')
        expect(() => m.send(s)).to.throw()
      })
      */
    })

    describe("getters", () => {
      const m = Message.assemble('{"msgid": "10", "msgtype": "FOO", "reqid": "xyz"}', '{}', '{}')

      it("should have msgid", () => {
        expect(m.msgid()).to.be.equal("10")
      })

      it("should have msgtype", () => {
        expect(m.msgtype()).to.be.equal("FOO")
      })

      it("should have reqid", () => {
        expect(m.reqid()).to.be.equal("xyz")
      })
    })

    describe("problem method", () => {

      it("should return null on valid message", () => {
        const m = Message.assemble('{"msgid": "10", "msgtype": "FOO"}', '{}', '{}')
        expect(m.problem()).to.be.null
      })

      it("should return message for missing msgtype", () => {
        const m = Message.assemble('{"msgid": "10"}', '{}', '{}')
        expect(m.problem()).to.be.equal("No msgtype in header")
      })

      it("should return message for missing msgid", () => {
        const m = Message.assemble('{"msgtype": "FOO"}', '{}', '{}')
        expect(m.problem()).to.be.equal("No msgid in header")
      })
    })
  })
})
