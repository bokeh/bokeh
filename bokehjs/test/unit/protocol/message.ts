import {expect} from "#framework/assertions"

import {Buffer} from "@bokehjs/core/serialization"
import {Message} from "@bokehjs/protocol/message"
import {wildcard} from "@bokehjs/core/util/eq"

class MockSock {
  readonly sent: unknown[] = []

  send(data: unknown): void {
    this.sent.push(data)
  }
}

describe("protocol/message module", () => {

  describe("Message", () => {

    it("should decode an envelope", () => {
      const envelope = Message.decode('{"header":{"msgid":"10","msgtype":"FOO"},"content":{"baz":3},"buffers":[]}')

      expect(envelope).to.be.equal({
        header: {msgid: "10", msgtype: "FOO"},
        content: {baz: 3},
        buffers: [],
      })
    })

    describe("create method", () => {
      const m = Message.create("FOO", {baz: 3})

      it("should return a message with a generated header", () => {
        expect(m).to.be.instanceof(Message)
        expect(m.header).to.be.equal({msgid: wildcard, msgtype: "FOO"})
      })

      it("should retain content as-is", () => {
        expect(m.content).to.be.equal({baz: 3})
      })

      it("should start without buffers", () => {
        expect(m.buffers).to.be.equal(new Map())
      })
    })

    describe("create_header method", () => {
      const h = Message.create_header("FOO")

      it("should return a header", () => {
        expect(h).to.be.equal({msgid: wildcard, msgtype: "FOO"})
      })

      it("should generate new ids", () => {
        const h2 = Message.create_header("FOO")
        expect(h.msgid).to.not.be.equal(h2.msgid)
      })
    })

    describe("send method", () => {

      it("should send one JSON envelope without buffers", () => {
        const m = new Message({msgid: "10", msgtype: "FOO"}, {baz: 3})
        const s = new MockSock()

        m.send(s)

        expect(s.sent.length).to.be.equal(1)
        expect(JSON.parse(s.sent[0] as string)).to.be.equal({
          header: {msgid: "10", msgtype: "FOO"},
          content: {baz: 3},
          buffers: [],
        })
      })

      it("should send binary payloads after their envelope", () => {
        const payload = new ArrayBuffer(8)
        const m = new Message({msgid: "10", msgtype: "FOO"}, {value: new Buffer(payload)})
        const s = new MockSock()

        m.send(s)

        expect(s.sent.length).to.be.equal(2)
        expect(JSON.parse(s.sent[0] as string)).to.be.equal({
          header: {msgid: "10", msgtype: "FOO"},
          content: {value: {id: "0"}},
          buffers: ["0"],
        })
        expect(s.sent[1]).to.be.equal(payload)
      })
    })

    describe("getters", () => {
      const m = new Message({msgid: "10", msgtype: "FOO", reqid: "xyz"}, {})

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

      it("should return null on a valid message", () => {
        expect(new Message({msgid: "10", msgtype: "FOO"}, {}).problem()).to.be.null
      })

      it("should return a message for missing msgtype", () => {
        expect(new Message({msgid: "10"}, {}).problem()).to.be.equal("No msgtype in header")
      })

      it("should return a message for missing msgid", () => {
        expect(new Message({msgtype: "FOO"}, {}).problem()).to.be.equal("No msgid in header")
      })
    })
  })
})
