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
      const envelope = Message.decode('{"header":{"msgid":"10","msgtype":"ACK"},"content":{"baz":3},"buffers":[]}')

      expect(envelope).to.be.equal({
        header: {msgid: "10", msgtype: "ACK"},
        content: {baz: 3},
        buffers: [],
      })
    })

    const invalid_envelopes: [string, unknown][] = [
      ["a non-object envelope", []],
      ["missing envelope fields", {header: {msgid: "10", msgtype: "ACK"}, content: {}}],
      ["extra envelope fields", {header: {msgid: "10", msgtype: "ACK"}, content: {}, buffers: [], extra: true}],
      ["a non-object header", {header: [], content: {}, buffers: []}],
      ["a missing message id", {header: {msgtype: "ACK"}, content: {}, buffers: []}],
      ["an empty message id", {header: {msgid: "", msgtype: "ACK"}, content: {}, buffers: []}],
      ["an unknown message type", {header: {msgid: "10", msgtype: "NOPE"}, content: {}, buffers: []}],
      ["an invalid request id", {header: {msgid: "10", msgtype: "ACK", reqid: 20}, content: {}, buffers: []}],
      ["an extra header field", {header: {msgid: "10", msgtype: "ACK", extra: true}, content: {}, buffers: []}],
      ["non-object content", {header: {msgid: "10", msgtype: "ACK"}, content: [], buffers: []}],
      ["a non-list buffer index", {header: {msgid: "10", msgtype: "ACK"}, content: {}, buffers: "a"}],
      ["an empty buffer id", {header: {msgid: "10", msgtype: "ACK"}, content: {}, buffers: [""]}],
      ["duplicate buffer ids", {header: {msgid: "10", msgtype: "ACK"}, content: {}, buffers: ["a", "a"]}],
      ["too many buffers", {
        header: {msgid: "10", msgtype: "ACK"}, content: {}, buffers: Array.from({length: 10_001}, (_, i) => `${i}`),
      }],
    ]

    for (const [description, envelope] of invalid_envelopes) {
      it(`should reject ${description}`, () => {
        expect(() => Message.decode(JSON.stringify(envelope))).to.throw()
      })
    }

    describe("create method", () => {
      const m = Message.create("PATCH-DOC", {baz: 3})

      it("should return a message with a generated header", () => {
        expect(m).to.be.instanceof(Message)
        expect(m.header).to.be.equal({msgid: wildcard, msgtype: "PATCH-DOC"})
      })

      it("should retain content as-is", () => {
        expect(m.content).to.be.equal({baz: 3})
      })

      it("should start without buffers", () => {
        expect(m.buffers).to.be.equal(new Map())
      })
    })

    describe("create_header method", () => {
      const h = Message.create_header("ACK")

      it("should return a header", () => {
        expect(h).to.be.equal({msgid: wildcard, msgtype: "ACK"})
      })

      it("should generate new ids", () => {
        const h2 = Message.create_header("ACK")
        expect(h.msgid).to.not.be.equal(h2.msgid)
      })
    })

    describe("send method", () => {

      it("should send one JSON envelope without buffers", () => {
        const m = new Message({msgid: "10", msgtype: "PATCH-DOC"}, {baz: 3})
        const s = new MockSock()

        m.send(s)

        expect(s.sent.length).to.be.equal(1)
        expect(JSON.parse(s.sent[0] as string)).to.be.equal({
          header: {msgid: "10", msgtype: "PATCH-DOC"},
          content: {baz: 3},
          buffers: [],
        })
      })

      it("should send binary payloads after their envelope", () => {
        const payload = new ArrayBuffer(8)
        const m = new Message({msgid: "10", msgtype: "PATCH-DOC"}, {value: new Buffer(payload)})
        const s = new MockSock()

        m.send(s)

        expect(s.sent.length).to.be.equal(2)
        expect(JSON.parse(s.sent[0] as string)).to.be.equal({
          header: {msgid: "10", msgtype: "PATCH-DOC"},
          content: {value: {id: "0"}},
          buffers: ["0"],
        })
        expect(s.sent[1]).to.be.equal(payload)
      })
    })

    describe("getters", () => {
      const m = new Message({msgid: "10", msgtype: "OK", reqid: "xyz"}, {})

      it("should have msgid", () => {
        expect(m.msgid()).to.be.equal("10")
      })

      it("should have msgtype", () => {
        expect(m.msgtype()).to.be.equal("OK")
      })

      it("should have reqid", () => {
        expect(m.reqid()).to.be.equal("xyz")
      })

      it("should have an optional reqid", () => {
        expect(new Message({msgid: "10", msgtype: "PATCH-DOC"}, {}).reqid()).to.be.undefined
      })
    })
  })
})
