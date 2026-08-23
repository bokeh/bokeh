import {expect, expect_instanceof} from "#framework/assertions"

import {Message} from "@bokehjs/protocol/message"
import {Receiver} from "@bokehjs/protocol/receiver"
import conformance from "./conformance.json" with {type: "json"}

const empty = '{"header":{"msgtype":"PATCH-DOC","msgid":"10"},"content":{"bar":20},"buffers":[]}'

describe("protocol/receiver module", () => {

  describe("Receiver", () => {

    it("should start without a message", () => {
      expect(new Receiver().message).to.be.null
    })

    it("should assemble an envelope without buffers", () => {
      const r = new Receiver()

      r.consume(empty)

      expect_instanceof(r.message, Message)
      expect(r.message.content).to.be.equal({bar: 20})
      expect(r.message.buffers).to.be.equal(new Map())
    })

    it("should assemble ordered binary payloads", () => {
      const r = new Receiver()
      const first = new ArrayBuffer(10)
      const second = new ArrayBuffer(20)

      r.consume('{"header":{"msgtype":"PATCH-DOC","msgid":"10"},"content":{},"buffers":["a","b"]}')
      expect(r.message).to.be.null
      r.consume(first)
      expect(r.message).to.be.null
      r.consume(second)

      expect_instanceof(r.message, Message)
      expect([...r.message.buffers.entries()]).to.be.equal([["a", first], ["b", second]])
    })

    it("should reject a binary envelope", () => {
      expect(() => new Receiver().consume(new ArrayBuffer(10))).to.throw()
    })

    it("should clear a completed message before rejecting a binary envelope", () => {
      const r = new Receiver()
      r.consume(empty)
      expect_instanceof(r.message, Message)

      expect(() => r.consume(new ArrayBuffer(10))).to.throw()

      expect(r.message).to.be.null
    })

    it("should reject text payloads and reset", () => {
      const r = new Receiver()
      r.consume('{"header":{"msgtype":"PATCH-DOC","msgid":"10"},"content":{},"buffers":["a"]}')

      expect(() => r.consume("payload")).to.throw()

      r.consume(empty)
      expect_instanceof(r.message, Message)
    })

    it("should reject duplicate buffer ids", () => {
      const r = new Receiver()
      const envelope = '{"header":{"msgtype":"PATCH-DOC","msgid":"10"},"content":{},"buffers":["a","a"]}'

      expect(() => r.consume(envelope)).to.throw()
    })

    for (const vector of conformance) {
      it(`should consume the shared ${vector.name} conformance vector`, () => {
        const r = new Receiver()
        r.consume(JSON.stringify(vector.envelope))
        for (const payload of vector.payloads) {
          r.consume(Uint8Array.from(payload).buffer)
        }

        expect_instanceof(r.message, Message)
        expect(JSON.stringify(r.message.header)).to.be.equal(JSON.stringify(vector.envelope.header))
        expect(r.message.content).to.be.equal(vector.envelope.content)
        expect([...r.message.buffers.keys()]).to.be.equal(vector.envelope.buffers)
        expect([...r.message.buffers.values()].map((buffer) => [...new Uint8Array(buffer)])).to.be.equal(vector.payloads)
      })
    }
  })
})
