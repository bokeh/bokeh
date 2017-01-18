{expect} = require "chai"
utils = require "../../utils"

serialization = utils.require "core/util/serialization"

describe "serialization module", ->

  describe "encode_typed_array", ->

    it "should encode Float32 arrays", ->
      array = new Float32Array([1.1, 2.2])
      shape = [2]
      e = serialization.encode_base64(array, shape)
      [d, s] = serialization.decode_base64(e)
      expect(array).to.be.deep.equal d
      expect(shape).to.be.deep.equal s

    it "should encode Float64 arrays", ->
      array = new Float64Array([1.1, 2.2])
      shape = [2]
      e = serialization.encode_base64(array, shape)
      [d, s] = serialization.decode_base64(e)
      expect(array).to.be.deep.equal d
      expect(shape).to.be.deep.equal s

    it "should encode Int8 arrays", ->
      array = new Int8Array([-1, 1])
      shape = [2]
      e = serialization.encode_base64(array, shape)
      [d, s] = serialization.decode_base64(e)
      expect(array).to.be.deep.equal d
      expect(shape).to.be.deep.equal s

    it "should encode Uint8 arrays", ->
      array = new Int8Array([1, 2])
      shape = [2]
      e = serialization.encode_base64(array, shape)
      [d, s] = serialization.decode_base64(e)
      expect(array).to.be.deep.equal d
      expect(shape).to.be.deep.equal s

    it "should encode Int16 arrays", ->
      array = new Int16Array([-1, 1])
      shape = [2]
      e = serialization.encode_base64(array, shape)
      [d, s] = serialization.decode_base64(e)
      expect(array).to.be.deep.equal d
      expect(shape).to.be.deep.equal s

    it "should encode Uint16 arrays", ->
      array = new Uint16Array([1, 2])
      shape = [2]
      e = serialization.encode_base64(array, shape)
      [d, s] = serialization.decode_base64(e)
      expect(array).to.be.deep.equal d
      expect(shape).to.be.deep.equal s

    it "should encode Int32 arrays", ->
      array = new Int32Array([-1, 1])
      shape = [2]
      e = serialization.encode_base64(array, shape)
      [d, s] = serialization.decode_base64(e)
      expect(array).to.be.deep.equal d
      expect(shape).to.be.deep.equal s

    it "should encode Uint32 arrays", ->
      array = new Uint32Array([1, 2])
      shape = [2]
      e = serialization.encode_base64(array, shape)
      [d, s] = serialization.decode_base64(e)
      expect(array).to.be.deep.equal d
      expect(shape).to.be.deep.equal s

  describe "decode_column_data", ->

    it "should encode typed column data source", ->
      data =
        x: new Float64Array([1, 2])
        y: new Float64Array([1.1, 2.2])
      shapes =
        x: [2]
        y: [2]
      e = serialization.encode_column_data(data, shapes)
      [d, s] = serialization.decode_column_data(e)
      expect(data).to.be.deep.equal d
      expect(shapes).to.be.deep.equal s

    it "should encode nested typed column data source", ->
      data =
        x: [new Float64Array([1, 2]), new Float64Array([2, 3])]
        y: [new Float64Array([1.1, 2.2]), new Float64Array([3.3, 4.4])]
      shapes =
        x: [[2], [2]]
        y: [[2], [2]]
      e = serialization.encode_column_data(data, shapes)
      [d, s] = serialization.decode_column_data(e)
      expect(data).to.be.deep.equal d
      expect(shapes).to.be.deep.equal s

    it "should encode mixed type column data source", ->
      data =
        x: new Float64Array([1, 2])
        y: [2.2, 3.3]
      shapes =
        x: [2]
      e = serialization.encode_column_data(data, shapes)
      [d, s] = serialization.decode_column_data(e)
      expect(data).to.be.deep.equal d
      expect(shapes).to.be.deep.equal s
