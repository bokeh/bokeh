{expect} = require "chai"

{Message} = require "protocol/message"
{Receiver} = require "protocol/receiver"

describe "protocol/receiver module", ->

  describe "Receiver", ->

    describe "default construction", ->

      it "should have a null message", ->
        r = new Receiver()
        expect(r.message).to.be.null


    describe "message with no buffers", ->
      r = new Receiver()

      describe "header consume", ->

        it "should should leave message null", ->
          res = r.consume('{"msgtype": "FOO", "msgid": "10"}')
          expect(res).to.be.undefined
          expect(r.message).to.be.null

        it "should throw an error on binary data", ->
          expect(() -> r.consume(new ArrayBuffer(10))).to.throw Error

      describe "metadata consume", ->

        it "should should leave message null", ->
          res = r.consume('{}')
          expect(res).to.be.undefined
          expect(r.message).to.be.null

        it "should throw an error on binary data", ->
          expect(() -> r.consume(new ArrayBuffer(10))).to.throw Error

      describe "metadata consume", ->

        it "should should set a complete message", ->
          res = r.consume('{"bar": "20"}')
          expect(res).to.be.undefined
          expect(r.message).to.be.instanceof Message
          expect(r.message.complete()).to.be.true

        it "should throw an error on binary data", ->
          expect(() -> r.consume(new ArrayBuffer(10))).to.throw Error

      describe "next header consume", ->

        it "should should leave message null", ->
          res = r.consume('{"msgtype": "FOO", "msgid": "11"}')
          expect(res).to.be.undefined
          expect(r.message).to.be.null

        it "should throw an error on binary data", ->
          expect(() -> r.consume(new ArrayBuffer(10))).to.throw Error

    describe "message with two buffers", ->
      r = new Receiver()

      describe "header consume", ->

        it "should throw an error on binary data", ->
          expect(() -> r.consume(new ArrayBuffer(10))).to.throw Error

        it "should should leave message null", ->
          res = r.consume('{"msgtype": "FOO", "msgid": "10", "num_buffers": 2}')
          expect(res).to.be.undefined
          expect(r.message).to.be.null

      describe "metadata consume", ->

        it "should throw an error on binary data", ->
          expect(() -> r.consume(new ArrayBuffer(10))).to.throw Error

        it "should should leave message null", ->
          res = r.consume('{}')
          expect(res).to.be.undefined
          expect(r.message).to.be.null

      describe "metadata consume", ->

        it "should throw an error on binary data", ->
          expect(() -> r.consume(new ArrayBuffer(10))).to.throw Error

        it "should should leave message null", ->
          res = r.consume('{"bar": "20"}')
          expect(res).to.be.undefined
          expect(r.message).to.be.null

      describe "first buffer header consume", ->

        it "should throw an error on binary data", ->
          expect(() -> r.consume(new ArrayBuffer(10))).to.throw Error

        it "should should leave message null", ->
          res = r.consume('foo')
          expect(res).to.be.undefined
          expect(r.message).to.be.null

      describe "first buffer payload consume", ->

        it "should throw an error on text data", ->
          expect(() -> r.consume("junk")).to.throw Error

        it "should should leave message null", ->
          res = r.consume(new ArrayBuffer(10))
          expect(res).to.be.undefined
          expect(r.message).to.be.null

      describe "second buffer header consume", ->

        it "should throw an error on binary data", ->
          expect(() -> r.consume(new ArrayBuffer(10))).to.throw Error

        it "should should leave message null", ->
          res = r.consume('bar')
          expect(res).to.be.undefined
          expect(r.message).to.be.null

      describe "second buffer payload consume", ->

        it "should throw an error on test data", ->
          expect(() -> r.consume("junk")).to.throw Error

        it "should should set a complete message", ->
          res = r.consume(new ArrayBuffer(20))
          expect(res).to.be.undefined
          expect(r.message).to.be.instanceof Message
          expect(r.message.complete()).to.be.true
          expect(r.message.buffers.length).to.be.equal 2
          expect(r.message.buffers[0].length).to.be.equal 2
          expect(r.message.buffers[1].length).to.be.equal 2
          expect(r.message.buffers[0][0]).to.be.equal 'foo'
          expect(r.message.buffers[0][1]).to.be.instanceof ArrayBuffer
          expect(r.message.buffers[1][0]).to.be.equal 'bar'
          expect(r.message.buffers[1][1]).to.be.instanceof ArrayBuffer

      describe "next header consume", ->

        it "should should leave message null", ->
          res = r.consume('{"msgtype": "FOO", "msgid": "11"}')
          expect(res).to.be.undefined
          expect(r.message).to.be.null

        it "should throw an error on binary data", ->
          expect(() -> r.consume(new ArrayBuffer(10))).to.throw Error
