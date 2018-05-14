{expect} = require "chai"

{Message} = require "protocol/message"

class MockSock
  constructor: () -> @sent = []
  send: (data) -> @sent.push(data)

describe "protocol/message module", ->

  describe "Message", ->

    describe "assemble method", ->

      it "should create new Messages from JSON", ->
        m = Message.assemble('{"msgid": "10", "msgtype": "FOO"}', '{"bar":2}', '{"baz":3}')
        expect(m).to.be.instanceof Message
        expect(m.complete()).to.be.true

        expect(m.header).to.be.deep.equal {msgid: '10', msgtype: 'FOO'}
        expect(m.metadata).to.be.deep.equal {bar:2}
        expect(m.content).to.be.deep.equal {baz:3}
        expect(m.buffers).to.be.deep.equal []

    describe "assemble_buffer method", ->
      m = Message.create("FOO", {bar:2}, {baz:3})
      m.header.num_buffers = 2

      it "should append a new buffer", ->
        m.assemble_buffer(1, 2)
        expect(m.buffers).to.be.deep.equal [[1,2]]
        m.assemble_buffer(3, 4)
        expect(m.buffers).to.be.deep.equal [[1,2], [3,4]]

      it "should raise an error if num_buffers is exceeded", ->
        expect(() -> m.assemble_buffer(5, 6)).to.throw Error

    describe "create method", ->
      m = Message.create("FOO", {bar:2}, {baz:3})

      it "should return a complete Message", ->
        expect(m).to.be.instanceof Message
        expect(m.complete()).to.be.true

      it "with a generated header", ->
        expect(m.header).to.be.instanceof Object
        expect(Object.keys(m.header).length).to.be.equal 2
        expect(m.header.msgtype).to.be.equal "FOO"
        expect(m.header).to.have.any.keys('msgid')

      it "and metadata and content as-is", ->
        expect(m.metadata).to.be.deep.equal {bar:2}
        expect(m.content).to.be.deep.equal {baz:3}

      it "and no buffers", ->
        expect(m.buffers).to.be.deep.equal []

    describe "create_header method", ->
      h = Message.create_header("FOO")

      it "should return a header obj", ->
        expect(h).to.be.instanceof Object
        expect(Object.keys(h).length).to.be.equal 2
        expect(h.msgtype).to.be.equal "FOO"
        expect(h).to.have.any.keys('msgid')

      it "should generate new ids", ->
        h2 = Message.create_header("FOO")
        expect(h.msgid).to.not.be.equal h2.msgid

    describe "complete method", ->

      it "should return false if header is missing", ->
        m = Message.assemble('{"msgid": "10", "msgtype": "FOO"}', '{"bar":2}', '{"baz":3}')
        m.header = null
        expect(m.complete()).to.be.false

      it "should return false if content is missing", ->
        m = Message.assemble('{"msgid": "10", "msgtype": "FOO"}', '{"bar":2}', '{"baz":3}')
        m.metadata = null
        expect(m.complete()).to.be.false

      it "should return false if metadata is missing", ->
        m = Message.assemble('{"msgid": "10", "msgtype": "FOO"}', '{"bar":2}', '{"baz":3}')
        m.content = null
        expect(m.complete()).to.be.false

      it "should return true if num_buffers matches", ->
        m = Message.assemble('{"msgid": "10", "msgtype": "FOO"}', '{"bar":2}', '{"baz":3}')
        expect(m.complete()).to.be.true
        m = Message.assemble('{"msgid": "10", "msgtype": "FOO", "num_buffers": 1}', '{"bar":2}', '{"baz":3}')
        m.assemble_buffer(1, 2)
        expect(m.complete()).to.be.true

      it "should return false if num_buffers does not match", ->
        m = Message.assemble('{"msgid": "10", "msgtype": "FOO", "num_buffers": 1}', '{"bar":2}', '{"baz":3}')
        expect(m.complete()).to.be.false

    describe "send method", ->

      it "should send header, metadata, and content as JSON, in order", ->
        m = Message.assemble('{"msgid": "10", "msgtype": "FOO"}', '{"bar":2}', '{"baz":3}')
        s = new MockSock()
        m.send(s)
        expect(s.sent.length).to.be.equal 3
        expect(JSON.parse(s.sent[0])).to.deep.equal {msgid: "10", msgtype: "FOO"}
        expect(JSON.parse(s.sent[1])).to.deep.equal {bar:2}
        expect(JSON.parse(s.sent[2])).to.deep.equal {baz:3}

      it "should raise an error if num_buffers is not zero or missing ", ->
        m = Message.assemble('{"msgid": "10", "msgtype": "FOO"}', '{"bar":2}', '{"baz":3}')
        m = Message.assemble('{"msgid": "10", "msgtype": "FOO", "num_buffers": 0}', '{"bar":2}', '{"baz":3}')
        m = Message.assemble('{"msgid": "10", "msgtype": "FOO", "num_buffers": 1}', '{"bar":2}', '{"baz":3}')
        expect(() -> m.send(s)).to.throw Error

    describe "getters", ->
      m = Message.assemble('{"msgid": "10", "msgtype": "FOO", "reqid": "xyz"}', '{}', '{}')

      it "should have msgid", ->
        expect(m.msgid()).to.be.equal "10"

      it "should have msgtype", ->
        expect(m.msgtype()).to.be.equal "FOO"

      it "should have reqid", ->
        expect(m.reqid()).to.be.equal "xyz"

    describe "problem method", ->

      it "should return null on valid message", ->
        m = Message.assemble('{"msgid": "10", "msgtype": "FOO"}', '{}', '{}')
        expect(m.problem()).to.be.null

      it "should return message for missing msgtype", ->
        m = Message.assemble('{"msgid": "10"}', '{}', '{}')
        expect(m.problem()).to.be.equal "No msgtype in header"

      it "should return message for missing msgid", ->
        m = Message.assemble('{"msgtype": "FOO"}', '{}', '{}')
        expect(m.problem()).to.be.equal "No msgid in header"
