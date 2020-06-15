import {expect} from "assertions"

import {Message} from "@bokehjs/protocol/message"
import {Receiver} from "@bokehjs/protocol/receiver"

describe("protocol/receiver module", () => {

  describe("Receiver", () => {

    describe("default construction", () => {

      it("should have a null message", () => {
        const r = new Receiver()
        expect(r.message).to.be.null
      })
    })

    describe("message with no buffers", () => {
      const r = new Receiver()

      describe("header consume", () => {

        it("should should leave message null", () => {
          const res = r.consume('{"msgtype": "FOO", "msgid": "10"}')
          expect(res).to.be.undefined
          expect(r.message).to.be.null
        })

        it("should throw an error on binary data", () => {
          expect(() => r.consume(new ArrayBuffer(10))).to.throw()
        })
      })

      describe("empty metadata consume", () => {

        it("should should leave message null", () => {
          const res = r.consume('{}')
          expect(res).to.be.undefined
          expect(r.message).to.be.null
        })

        it("should throw an error on binary data", () => {
          expect(() => r.consume(new ArrayBuffer(10))).to.throw()
        })
      })

      describe("metadata consume", () => {

        it("should should set a complete message", () => {
          const res = r.consume('{"bar": "20"}')
          expect(res).to.be.undefined
          expect(r.message).to.be.instanceof(Message)
          expect(r.message!.complete()).to.be.true
        })

        it("should throw an error on binary data", () => {
          expect(() => r.consume(new ArrayBuffer(10))).to.throw()
        })
      })

      describe("next header consume", () => {

        it("should should leave message null", () => {
          const res = r.consume('{"msgtype": "FOO", "msgid": "11"}')
          expect(res).to.be.undefined
          expect(r.message).to.be.null
        })

        it("should throw an error on binary data", () => {
          expect(() => r.consume(new ArrayBuffer(10))).to.throw()
        })
      })
    })

    describe("message with two buffers", () => {
      const r = new Receiver()

      describe("header consume", () => {

        it("should throw an error on binary data", () => {
          expect(() => r.consume(new ArrayBuffer(10))).to.throw()
        })

        it("should should leave message null", () => {
          const res = r.consume('{"msgtype": "FOO", "msgid": "10", "num_buffers": 2}')
          expect(res).to.be.undefined
          expect(r.message).to.be.null
        })
      })

      describe("empty metadata consume", () => {

        it("should throw an error on binary data", () => {
          expect(() => r.consume(new ArrayBuffer(10))).to.throw()
        })

        it("should should leave message null", () => {
          const res = r.consume('{}')
          expect(res).to.be.undefined
          expect(r.message).to.be.null
        })
      })

      describe("metadata consume", () => {

        it("should throw an error on binary data", () => {
          expect(() => r.consume(new ArrayBuffer(10))).to.throw()
        })

        it("should should leave message null", () => {
          const res = r.consume('{"bar": "20"}')
          expect(res).to.be.undefined
          expect(r.message).to.be.null
        })
      })

      describe("first buffer header consume", () => {

        it("should throw an error on binary data", () => {
          expect(() => r.consume(new ArrayBuffer(10))).to.throw()
        })

        it("should should leave message null", () => {
          const res = r.consume('{"id": "1"}')
          expect(res).to.be.undefined
          expect(r.message).to.be.null
        })
      })

      describe("first buffer payload consume", () => {

        it("should throw an error on text data", () => {
          expect(() => r.consume("junk")).to.throw()
        })

        it("should should leave message null", () => {
          const res = r.consume(new ArrayBuffer(10))
          expect(res).to.be.undefined
          expect(r.message).to.be.null
        })
      })

      describe("second buffer header consume", () => {

        it("should throw an error on binary data", () => {
          expect(() => r.consume(new ArrayBuffer(10))).to.throw()
        })

        it("should should leave message null", () => {
          const res = r.consume('{"id": "2"}')
          expect(res).to.be.undefined
          expect(r.message).to.be.null
        })
      })

      describe("second buffer payload consume", () => {

        it("should throw an error on test data", () => {
          expect(() => r.consume("junk")).to.throw()
        })

        it("should should set a complete message", () => {
          const res = r.consume(new ArrayBuffer(20))
          expect(res).to.be.undefined
          expect(r.message).to.be.instanceof(Message)
          expect(r.message!.complete()).to.be.true
          const {buffers} = r.message!
          expect(buffers.size).to.be.equal(2)
          const entries = [...buffers.entries()]
          expect(entries[0][0]).to.be.equal("1")
          expect(entries[0][1]).to.be.instanceof(ArrayBuffer)
          expect(entries[1][0]).to.be.equal("2")
          expect(entries[1][1]).to.be.instanceof(ArrayBuffer)
        })
      })

      describe("next header consume", () => {

        it("should should leave message null", () => {
          const res = r.consume('{"msgtype": "FOO", "msgid": "11"}')
          expect(res).to.be.undefined
          expect(r.message).to.be.null
        })

        it("should throw an error on binary data", () => {
          expect(() => r.consume(new ArrayBuffer(10))).to.throw()
        })
      })
    })
  })
})
