import {expect, expect_instanceof} from "#framework/assertions"

import {Message} from "@bokehjs/protocol/message"
import {Receiver} from "@bokehjs/protocol/receiver"

const empty = '{"header":{"msgtype":"FOO","msgid":"10"},"content":{"bar":20},"buffers":[]}'

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

      r.consume('{"header":{"msgtype":"FOO","msgid":"10"},"content":{},"buffers":["a","b"]}')
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

    it("should reject text payloads and reset", () => {
      const r = new Receiver()
      r.consume('{"header":{"msgtype":"FOO","msgid":"10"},"content":{},"buffers":["a"]}')

      expect(() => r.consume("payload")).to.throw()

      r.consume(empty)
      expect_instanceof(r.message, Message)
    })

    it("should reject duplicate buffer ids", () => {
      const r = new Receiver()
      const envelope = '{"header":{"msgtype":"FOO","msgid":"10"},"content":{},"buffers":["a","a"]}'

      expect(() => r.consume(envelope)).to.throw()
    })
  })
})
