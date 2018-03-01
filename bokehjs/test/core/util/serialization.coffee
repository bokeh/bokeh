{expect} = require "chai"
utils = require "../../utils"

ser = utils.require "core/util/serialization"
{isObject} = utils.require "core/util/types"

GOOD_TYPES = [
  Float32Array, Float64Array, Uint8Array, Int8Array,
  Uint16Array, Int16Array, Uint32Array, Int32Array
]

describe "serialization module", ->

  describe "ARRAY_TYPES", ->

    it "should map to all available typed array types", ->
      expected  =
        float32: Float32Array
        float64: Float64Array
        uint8: Uint8Array
        int8: Int8Array
        uint16: Uint16Array
        int16: Int16Array
        uint32: Uint32Array
        int32: Int32Array
      expect(ser.ARRAY_TYPES).to.be.deep.equal(expected)

  describe "DTYPES", ->

    for typ in GOOD_TYPES
      it "should map #{typ.name} type names to #{ser.DTYPES[typ.name]}", ->
        expect(ser.ARRAY_TYPES[ser.DTYPES[typ.name]]).to.be.equal typ

  describe "BYTE_ORDER", ->

    it "should be big or little", ->
      # not a great test but the best we can do for now
      o = ser.BYTE_ORDER
      expect(o=="big" or o=="little").to.be.true

  describe "byte swap functions", ->
    sample = [0, 1,2,3,4,5,6,7,8,9,10,12,13,14,15]

    it "should have swap16 that swaps 2 bytes in place", ->
      a = new Uint8Array(4)
      for i in [0...4]
        a[i] = i
      b = new Uint16Array(a.buffer)
      expect(b.length).to.be.equal 2
      swapped = new Uint8Array(4)
      swapped[0] = 1
      swapped[1] = 0
      swapped[2] = 3
      swapped[3] = 2
      r = ser.swap16(b)
      expect(a).to.be.deep.equal swapped

    it "should have swap32 that swaps 4 bytes in place", ->
      a = new Uint8Array(8)
      for i in [0...8]
        a[i] = i
      b = new Float32Array(a.buffer)
      expect(b.length).to.be.equal 2
      swapped = new Uint8Array(8)
      swapped[0] = 3
      swapped[1] = 2
      swapped[2] = 1
      swapped[3] = 0
      swapped[4] = 7
      swapped[5] = 6
      swapped[6] = 5
      swapped[7] = 4
      r = ser.swap32(b)
      expect(a).to.be.deep.equal swapped

    it "should have swap64 that swaps 8 bytes in place", ->
      a = new Uint8Array(16)
      for i in [0...16]
        a[i] = i
      b = new Float64Array(a.buffer)
      expect(b.length).to.be.equal 2
      swapped = new Uint8Array(16)
      swapped[0]  = 7
      swapped[1]  = 6
      swapped[2]  = 5
      swapped[3]  = 4
      swapped[4]  = 3
      swapped[5]  = 2
      swapped[6]  = 1
      swapped[7]  = 0
      swapped[8]  = 15
      swapped[9]  = 14
      swapped[10] = 13
      swapped[11] = 12
      swapped[12] = 11
      swapped[13] = 10
      swapped[14] = 9
      swapped[15] = 8
      r = ser.swap64(b)
      expect(a).to.be.deep.equal swapped

  describe "process_buffer function", ->

  describe "process_array function", ->

  describe "base64 conversion functions", ->

    for typ in GOOD_TYPES
      it "should round trip #{typ.name} buffers", ->
        a = new Uint8Array(16)
        for i in [0...16]
          a[i] = i

        b = new typ(a)
        b64 = ser.arrayBufferToBase64(b.buffer)
        expect(typeof b64).to.be.equal "string"
        buf = ser.base64ToArrayBuffer(b64)
        c = new typ(buf)
        expect(c).to.be.deep.equal b

  describe "encode/decode base64 functions", ->

    for typ in GOOD_TYPES
      it "should roundtrip #{typ.name} arrays", ->
        array = new typ([1, 2])
        shape = [2]
        e = ser.encode_base64(array, shape)
        expect(isObject(e)).to.be.true
        expect(Object.keys(e).length).to.be.equal 3
        expect(e.dtype).to.equal ser.DTYPES[typ.name]
        expect(e.shape).to.be.deep.equal [2]

        [d, s] = ser.decode_base64(e)
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
      e = ser.encode_column_data(data, shapes)
      [d, s] = ser.decode_column_data(e)
      expect(data).to.be.deep.equal d
      expect(shapes).to.be.deep.equal s

    it "should encode nested typed column data source", ->
      data =
        x: [new Float64Array([1, 2]), new Float64Array([2, 3])]
        y: [new Float64Array([1.1, 2.2]), new Float64Array([3.3, 4.4])]
      shapes =
        x: [[2], [2]]
        y: [[2], [2]]
      e = ser.encode_column_data(data, shapes)
      [d, s] = ser.decode_column_data(e)
      expect(data).to.be.deep.equal d
      expect(shapes).to.be.deep.equal s

    it "should encode mixed type column data source", ->
      data =
        x: new Float64Array([1, 2])
        y: [2.2, 3.3]
      shapes =
        x: [2]
      e = ser.encode_column_data(data, shapes)
      [d, s] = ser.decode_column_data(e)
      expect(data).to.be.deep.equal d
      expect(shapes).to.be.deep.equal s

  describe "encode_column_data", ->

    for typ in GOOD_TYPES
      it "should encode #{typ.name} array columns", ->
        data = {a : new typ([1, 2]), b: [10, 20]}
        enc = ser.encode_column_data(data)
        expect(enc['b']).to.be.deep.equal [10, 20]
        expect(enc['a']).to.be.deep.equal {
          '__ndarray__': ser.arrayBufferToBase64(data['a'].buffer),
          'shape': undefined,
          'dtype': ser.DTYPES[typ.name]
        }

    for typ in GOOD_TYPES
      it "should encode ragged #{typ.name} array columns", ->
        data = {a : [new typ([1, 2]), new typ([1, 2])], b: [10, 20]}
        enc = ser.encode_column_data(data)
        expect(enc['b']).to.be.deep.equal [10, 20]
        expect(enc['a']).to.be.deep.equal [{
          '__ndarray__': ser.arrayBufferToBase64(data['a'][0].buffer),
          'shape': undefined,
          'dtype': ser.DTYPES[typ.name]
        }, {
          '__ndarray__': ser.arrayBufferToBase64(data['a'][1].buffer),
          'shape': undefined,
          'dtype': ser.DTYPES[typ.name]
        }]

    for typ in GOOD_TYPES
      it "should encode #{typ.name} array columns with shapes", ->
        data = {a : new typ([1, 2, 3, 4]), b: [10, 20]}
        enc = ser.encode_column_data(data, {a: [2,2]})
        expect(enc['b']).to.be.deep.equal [10, 20]
        expect(enc['a']).to.be.deep.equal {
          '__ndarray__': ser.arrayBufferToBase64(data['a'].buffer),
          'shape': [2,2],
          'dtype': ser.DTYPES[typ.name]
        }

        data = {a : [new typ([1, 2]), new typ([1, 2])], b: [10, 20]}
        enc = ser.encode_column_data(data, {a: [[1,2], [2, 1]]})
        expect(enc['b']).to.be.deep.equal [10, 20]
        expect(enc['a']).to.be.deep.equal [{
          '__ndarray__': ser.arrayBufferToBase64(data['a'][0].buffer),
          'shape': [1,2],
          'dtype': ser.DTYPES[typ.name]
        }, {
          '__ndarray__': ser.arrayBufferToBase64(data['a'][1].buffer),
          'shape': [2,1],
          'dtype': ser.DTYPES[typ.name]
        }]
